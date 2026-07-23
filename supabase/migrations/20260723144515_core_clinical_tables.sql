-- Pacientes, agenda e prontuário (anamnese + evoluções clínicas)

create table public.pacientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cpf text,
  nascimento date,
  telefone text,
  endereco text,
  profissao text,
  peso numeric,
  altura numeric,
  status text not null default 'ativo' check (status in ('ativo', 'inativo')),
  data_inativacao date,
  autorizou_imagem boolean not null default false,
  data_assinatura_imagem date,
  termo_imagem_path text,
  valor_mensalidade numeric,
  vencimento date,
  status_pagamento text not null default 'pendente' check (status_pagamento in ('pendente', 'pago')),
  data_pagamento date,
  forma_pagamento text,
  proxima_avaliacao date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.agenda (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  tipo text not null check (tipo in ('pilates', 'fisioterapia', 'quiropraxia')),
  data date not null,
  horario time not null,
  status text not null default 'agendado' check (status in ('agendado', 'realizado', 'falta', 'cancelado')),
  confirmacao text not null default 'pendente' check (confirmacao in ('pendente', 'confirmou', 'cancelou')),
  motivo_alteracao text,
  tem_reposicao boolean not null default false,
  created_at timestamptz not null default now()
);
create index agenda_data_idx on public.agenda (data);

create table public.agenda_historico (
  id uuid primary key default gen_random_uuid(),
  agenda_id uuid not null references public.agenda (id) on delete cascade,
  data timestamptz not null default now(),
  acao text not null,
  motivo text
);

create table public.anamneses (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null unique references public.pacientes (id) on delete cascade,
  texto text,
  atualizado_em date not null default current_date,
  updated_by uuid references public.profiles (id)
);

create table public.evolucoes (
  id uuid primary key default gen_random_uuid(),
  paciente_id uuid not null references public.pacientes (id) on delete cascade,
  data date not null,
  sinais_vitais jsonb not null default '{}',
  pre jsonb not null default '{}',
  intercorrencias jsonb not null default '{}',
  pos jsonb not null default '{}',
  aparelhos text[] not null default '{}',
  acessorios text[] not null default '{}',
  acessorios_outros text,
  aquecimento text[] not null default '{}',
  aquecimento_outros text,
  mobilidade text[] not null default '{}',
  mobilidade_outros text,
  alongamentos text[] not null default '{}',
  alongamentos_outros text,
  fortalecimento jsonb not null default '{}',
  fortalecimento_outros text,
  relaxamento text[] not null default '{}',
  relaxamento_outros text,
  outros_treinos text[] not null default '{}',
  observacoes text,
  profissional_id uuid references public.profiles (id),
  profissional_nome text not null,
  crefito text,
  created_at timestamptz not null default now()
);
create index evolucoes_paciente_data_idx on public.evolucoes (paciente_id, data);
