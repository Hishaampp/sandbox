-- Let a student remove an ID photo they uploaded only while no submission
-- refers to it (for example, the upload succeeded but saving the details
-- failed). Once a submission points at the photo, only admins can delete it.
create policy "id cards own orphan delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'id-cards'
    and (storage.foldername(name))[1] = auth.uid()::text
    and not exists (
      select 1 from public.student_verifications v
      where v.id_card_path = storage.objects.name
    )
  );
