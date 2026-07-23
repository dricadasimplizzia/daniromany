-- Buckets privados para upload real de arquivo (documentos + termos de uso de imagem)

insert into storage.buckets (id, name, public)
values
  ('documentos', 'documentos', false),
  ('termos-imagem', 'termos-imagem', false)
on conflict (id) do nothing;

-- documentos: a visibilidade do arquivo segue a mesma regra da linha
-- correspondente em public.documentos (campo `restrito`).
create policy "documentos bucket: select segue a tabela"
  on storage.objects for select
  using (
    bucket_id = 'documentos'
    and public.is_active_user()
    and exists (
      select 1 from public.documentos d
      where d.storage_path = storage.objects.name
        and (not d.restrito or public.current_app_role() in ('proprietaria', 'administradora'))
    )
  );

create policy "documentos bucket: upload"
  on storage.objects for insert
  with check (bucket_id = 'documentos' and public.is_active_user());

create policy "documentos bucket: apagar só quem vê restrito"
  on storage.objects for delete
  using (
    bucket_id = 'documentos'
    and public.is_active_user()
    and public.current_app_role() in ('proprietaria', 'administradora')
  );

-- termos-imagem: mesma audiência de quem acessa dado do paciente
-- (proprietária, administradora, fisioterapia — não quiropraxia).
create policy "termos-imagem bucket: select"
  on storage.objects for select
  using (
    bucket_id = 'termos-imagem'
    and public.is_active_user()
    and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia')
  );

create policy "termos-imagem bucket: upload"
  on storage.objects for insert
  with check (
    bucket_id = 'termos-imagem'
    and public.is_active_user()
    and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia')
  );

create policy "termos-imagem bucket: apagar"
  on storage.objects for delete
  using (
    bucket_id = 'termos-imagem'
    and public.is_active_user()
    and public.current_app_role() in ('proprietaria', 'administradora', 'fisioterapia')
  );
