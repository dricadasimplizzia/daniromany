-- Row Level Security: reproduz a matriz de permissões do protótipo no próprio banco,
-- para que a autorização não dependa só da UI esconder botão/aba.
--
-- Papéis: proprietaria (nivel "total"), administradora ("gerencial"),
--         fisioterapia ("fisio"), quiropraxia ("restrito").

-- ---------------------------------------------------------------------------
-- Gatilhos de apoio
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger pacientes_set_updated_at
  before update on public.pacientes
  for each row execute function public.set_updated_at();

-- Só a proprietária pode mudar o valor da mensalidade (igual ao campo
-- desabilitado no protótipo para quem não é nivel "total") — reforçado aqui
-- porque o campo não pode depender só do input estar "disabled" no client.
create function public.guard_valor_mensalidade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_app_role() = 'proprietaria' then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    if new.valor_mensalidade is not null then
      raise exception 'Somente a proprietária pode definir o valor da mensalidade.';
    end if;
  elsif new.valor_mensalidade is distinct from old.valor_mensalidade then
    raise exception 'Somente a proprietária pode alterar o valor da mensalidade.';
  end if;

  return new;
end;
$$;

create trigger pacientes_guard_mensalidade
  before insert or update on public.pacientes
  for each row execute function public.guard_valor_mensalidade();

-- ---------------------------------------------------------------------------
-- View somente-leitura com colunas não sensíveis de pacientes, usada por quem
-- não tem a aba "Pacientes" (perfil quiropraxia) mas precisa escolher o nome do
-- paciente na própria agenda/comissão. Sem security_invoker: roda com o
-- privilégio do dono (contorno intencional do RLS da tabela base, só que
-- expondo apenas id/nome/status — nunca CPF, endereço ou dado financeiro).
create view public.pacientes_basico as
  select id, nome, status from public.pacientes;
grant select on public.pacientes_basico to authenticated;

-- ---------------------------------------------------------------------------
-- pacientes / anamneses / evolucoes — cadastro e prontuário clínico
-- ---------------------------------------------------------------------------
alter table public.pacientes enable row level security;
alter table public.anamneses enable row level security;
alter table public.evolucoes enable row level security;

create policy "pacientes: select" on public.pacientes for select
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'));
create policy "pacientes: insert" on public.pacientes for insert
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'));
create policy "pacientes: update" on public.pacientes for update
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'));
create policy "pacientes: delete" on public.pacientes for delete
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'));

-- anamnese e evolução: só quem atende clinicamente (proprietária + fisioterapia).
-- Administradora e quiropraxia não têm acesso a dado clínico, igual a
-- `podeVerClinico` no protótipo.
create policy "anamneses: acesso clínico" on public.anamneses for all
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'fisioterapia'))
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'fisioterapia'));

create policy "evolucoes: acesso clínico" on public.evolucoes for all
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'fisioterapia'))
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'fisioterapia'));

-- ---------------------------------------------------------------------------
-- agenda — todo mundo acessa, mas o perfil quiropraxia só enxerga/mexe nos
-- próprios atendimentos (tipo = 'quiropraxia'). Isso é um reforço em relação
-- ao protótipo (lá o filtro era só visual); aqui vira regra de banco.
-- ---------------------------------------------------------------------------
alter table public.agenda enable row level security;
alter table public.agenda_historico enable row level security;

create policy "agenda: select" on public.agenda for select
  using (public.is_active_user() and (public.current_app_role() <> 'quiropraxia' or tipo = 'quiropraxia'));
create policy "agenda: insert" on public.agenda for insert
  with check (public.is_active_user() and (public.current_app_role() <> 'quiropraxia' or tipo = 'quiropraxia'));
create policy "agenda: update" on public.agenda for update
  using (public.is_active_user() and (public.current_app_role() <> 'quiropraxia' or tipo = 'quiropraxia'));
create policy "agenda: delete" on public.agenda for delete
  using (public.is_active_user() and (public.current_app_role() <> 'quiropraxia' or tipo = 'quiropraxia'));

create policy "agenda_historico: acesso via agenda" on public.agenda_historico for all
  using (
    public.is_active_user() and exists (
      select 1 from public.agenda a
      where a.id = agenda_historico.agenda_id
        and (public.current_app_role() <> 'quiropraxia' or a.tipo = 'quiropraxia')
    )
  );

-- ---------------------------------------------------------------------------
-- financeiro geral (caixa) — só a proprietária, igual a `podeVerGeral`
-- ---------------------------------------------------------------------------
alter table public.caixa enable row level security;

create policy "caixa: só proprietária" on public.caixa for all
  using (public.is_active_user() and public.current_app_role() = 'proprietaria')
  with check (public.is_active_user() and public.current_app_role() = 'proprietaria');

-- capacidade_horarios: todo mundo lê (usado pro limite de vagas na agenda),
-- só proprietária configura.
alter table public.capacidade_horarios enable row level security;

create policy "capacidade: leitura geral" on public.capacidade_horarios for select
  using (public.is_active_user());
create policy "capacidade: só proprietária edita" on public.capacidade_horarios for update
  using (public.is_active_user() and public.current_app_role() = 'proprietaria');

-- ---------------------------------------------------------------------------
-- quiropraxia_atendimentos — proprietária + profissional de quiropraxia
-- ---------------------------------------------------------------------------
alter table public.quiropraxia_atendimentos enable row level security;

create policy "quiropraxia: select" on public.quiropraxia_atendimentos for select
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'quiropraxia'));
create policy "quiropraxia: insert" on public.quiropraxia_atendimentos for insert
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'quiropraxia'));
create policy "quiropraxia: delete só proprietária" on public.quiropraxia_atendimentos for delete
  using (public.is_active_user() and public.current_app_role() = 'proprietaria');

-- ---------------------------------------------------------------------------
-- mensagens (comunicação simulada) — não visível para o perfil quiropraxia,
-- igual à aba "Comunicação" no protótipo.
-- ---------------------------------------------------------------------------
alter table public.mensagens enable row level security;

create policy "mensagens: acesso" on public.mensagens for all
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'))
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia'));

-- ---------------------------------------------------------------------------
-- compras & estoque — qualquer perfil solicita/vê; só proprietária e
-- administradora aprovam, rejeitam, avançam status ou editam estoque.
-- ---------------------------------------------------------------------------
alter table public.compras enable row level security;
alter table public.estoque enable row level security;

create policy "compras: select" on public.compras for select
  using (public.is_active_user());
create policy "compras: insert" on public.compras for insert
  with check (public.is_active_user());
create policy "compras: update só quem aprova" on public.compras for update
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora'));

create policy "estoque: select" on public.estoque for select
  using (public.is_active_user());
create policy "estoque: escreve só quem aprova" on public.estoque for insert
  with check (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora'));
create policy "estoque: atualiza só quem aprova" on public.estoque for update
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora'));
create policy "estoque: apaga só quem aprova" on public.estoque for delete
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora'));

-- ---------------------------------------------------------------------------
-- tarefas — uso interno livre para todos os perfis
-- ---------------------------------------------------------------------------
alter table public.tarefas enable row level security;

create policy "tarefas: acesso geral" on public.tarefas for all
  using (public.is_active_user())
  with check (public.is_active_user());

-- ---------------------------------------------------------------------------
-- documentos — restrito (contratos, alvarás, licenças, notas fiscais) só para
-- proprietária e administradora, igual a `podeVerRestrito` no protótipo.
-- ---------------------------------------------------------------------------
alter table public.documentos enable row level security;

create policy "documentos: select" on public.documentos for select
  using (
    public.is_active_user()
    and (not restrito or public.current_app_role() in ('proprietaria', 'administradora'))
  );
create policy "documentos: insert" on public.documentos for insert
  with check (public.is_active_user());
create policy "documentos: delete só quem vê restrito" on public.documentos for delete
  using (public.is_active_user() and public.current_app_role() in ('proprietaria', 'administradora'));
