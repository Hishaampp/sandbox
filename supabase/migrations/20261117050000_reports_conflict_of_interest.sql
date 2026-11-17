-- An admin never sees or handles a report about their own account:
-- they would learn who reported them and could dismiss it themselves.
-- Another admin (or the coordinator) handles those.

drop policy if exists "reports admin read" on public.reports;
create policy "reports admin read" on public.reports for select to authenticated
  using (
    reporter_id = auth.uid()
    or (public.is_admin() and target_profile_id is distinct from auth.uid())
  );

drop policy if exists "reports admin update" on public.reports;
create policy "reports admin update" on public.reports for update to authenticated
  using (public.is_admin() and target_profile_id is distinct from auth.uid())
  with check (public.is_admin() and target_profile_id is distinct from auth.uid());
