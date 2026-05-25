-- Grant Intake Hub — Storage bucket for uploaded grant documents (Phase 2)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'grant-documents',
  'grant-documents',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path: {user_id}/{intake_id}/{document_type}/{filename}
-- Members upload to their folder; admins read all.

drop policy if exists "grant_documents_storage_select_own" on storage.objects;
create policy "grant_documents_storage_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'grant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "grant_documents_storage_insert_own" on storage.objects;
create policy "grant_documents_storage_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'grant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "grant_documents_storage_update_own" on storage.objects;
create policy "grant_documents_storage_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'grant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'grant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "grant_documents_storage_delete_own" on storage.objects;
create policy "grant_documents_storage_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'grant-documents'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "grant_documents_storage_admin_all" on storage.objects;
create policy "grant_documents_storage_admin_all"
on storage.objects for all
to authenticated
using (
  bucket_id = 'grant-documents'
  and public.is_admin(auth.uid())
)
with check (
  bucket_id = 'grant-documents'
  and public.is_admin(auth.uid())
);

drop policy if exists "grant_documents_storage_service_role" on storage.objects;
create policy "grant_documents_storage_service_role"
on storage.objects for all
to service_role
using (bucket_id = 'grant-documents')
with check (bucket_id = 'grant-documents');
