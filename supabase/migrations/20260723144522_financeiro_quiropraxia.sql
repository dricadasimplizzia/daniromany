-- Financeiro (caixa), configuração de capacidade da agenda e comissão de quiropraxia

create table public.caixa (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric not null,
  data date not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);
create index caixa_data_idx on public.caixa (data);

create table public.capacidade_horarios (
  tipo text primary key check (tipo in ('pilates', 'fisioterapia')),
  limite integer not null
);
insert into public.capacidade_horarios (tipo, limite) values ('pilates', 6), ('fisioterapia', 3);

-- Comissão calculada pelo próprio banco (generated column), não pela aplicação:
-- evita que um bug no client grave uma divisão errada. Percentual configurável
-- por lançamento, com 30% como padrão (mesma regra 30/70 do protótipo), para
-- caso outro profissional de quiropraxia entre com um acordo diferente no futuro.
create table public.quiropraxia_atendimentos (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  profissional_id uuid not null references public.profiles (id),
  data date not null,
  valor_pago numeric not null check (valor_pago >= 0),
  percentual_comissao numeric not null default 30 check (percentual_comissao between 0 and 100),
  comissao_profissional numeric generated always as (round(valor_pago * percentual_comissao / 100, 2)) stored,
  valor_studio numeric generated always as (round(valor_pago * (100 - percentual_comissao) / 100, 2)) stored,
  created_at timestamptz not null default now()
);
create index quiropraxia_data_idx on public.quiropraxia_atendimentos (data);
