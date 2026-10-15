-- =============================================================================
-- ZOUHRI FRAGRANCE - Migration 0004 : Stockage des medias
-- Bucket public en lecture, ecriture reservee au personnel autorise.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medias',
  'medias',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "medias_lecture_publique"
  on storage.objects for select
  using (bucket_id = 'medias');

create policy "medias_insertion_personnel"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'medias' and est_gestionnaire());

create policy "medias_maj_personnel"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'medias' and est_gestionnaire())
  with check (bucket_id = 'medias' and est_gestionnaire());

create policy "medias_suppression_personnel"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'medias' and est_gestionnaire());
