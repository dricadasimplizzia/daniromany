-- Extensões e tabela de perfis (papéis de acesso)

create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'proprietaria',
  'administradora',
  'fisioterapia',
  'quiropraxia'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  role public.app_role not null,
  crefito text,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfis da equipe da clínica, um por usuário de autenticação. Não há autocadastro — contas são criadas via seed/admin.';

-- Função auxiliar: retorna o papel do usuário autenticado atual.
-- security definer + search_path fixo evita que RLS em profiles crie recursão
-- infinita quando outras policies chamam esta função.
create function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select ativo from public.profiles where id = auth.uid()), false)
$$;

alter table public.profiles enable row level security;

-- Todo usuário autenticado e ativo pode ler os perfis (nomes aparecem em toda a UI:
-- responsável de tarefa, profissional da evolução, solicitante de compra etc).
create policy "profiles: leitura para usuários ativos"
  on public.profiles for select
  using (public.is_active_user());

-- Só a proprietária gerencia contas da equipe.
create policy "profiles: só proprietária edita"
  on public.profiles for update
  using (public.current_app_role() = 'proprietaria');
