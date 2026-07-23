-- Comunicação (log), compras & estoque, tarefas e central de documentos

create table public.mensagens (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid references public.pacientes (id) on delete set null,
  paciente_nome text,
  tipo text not null check (tipo in ('confirmacao', 'lembrete', 'pagamento', 'avaliacao')),
  contexto text,
  data timestamptz not null default now(),
  created_by uuid references public.profiles (id)
);

create table public.compras (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  categoria text not null check (categoria in ('Limpeza', 'Escritório', 'Equipamentos', 'Manutenção', 'Consumo', 'Outros')),
  quantidade integer not null default 1,
  valor_estimado numeric,
  fornecedor text,
  justificativa text,
  urgencia text not null default 'Média' check (urgencia in ('Baixa', 'Média', 'Alta')),
  solicitante_id uuid not null references public.profiles (id),
  data_solicitacao date not null default current_date,
  status text not null default 'Pendente' check (
    status in ('Pendente', 'Alteração solicitada', 'Aprovado', 'Rejeitado', 'Comprado', 'Entregue', 'Cancelado')
  ),
  valor_aprovado numeric,
  fornecedor_escolhido text,
  data_prevista date,
  data_compra date,
  motivo_alteracao text,
  created_at timestamptz not null default now()
);
create index compras_status_idx on public.compras (status);

create table public.estoque (
  id uuid primary key default gen_random_uuid(),
  produto text not null,
  quantidade_atual numeric not null default 0,
  quantidade_minima numeric not null default 0
);

create table public.tarefas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  responsavel_id uuid references public.profiles (id),
  prazo date,
  prioridade text not null default 'Média' check (prioridade in ('Baixa', 'Média', 'Alta')),
  status text not null default 'Pendente' check (status in ('Pendente', 'Em andamento', 'Concluída')),
  created_at timestamptz not null default now()
);

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  categoria text not null check (
    categoria in ('Contratos', 'Alvarás', 'Licenças', 'Termos de uso de imagem', 'Modelos de recibo', 'Documentos do CREFITO', 'Notas fiscais de equipamentos')
  ),
  storage_path text not null,
  restrito boolean not null default true,
  data_upload date not null default current_date,
  uploaded_by uuid references public.profiles (id)
);
