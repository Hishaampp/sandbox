-- Campus-only people.
-- Idea summaries stay browsable by anyone signed in (the plan's promise:
-- "browse ideas and their public summaries straight away"). People do not:
-- profiles, skills, repositories and team membership are visible only to
-- verified students of the same campus (and admins). You always see yourself.

create or replace function public.my_college()
returns uuid language sql stable security definer set search_path = '' as $$
  select college_id from public.profiles where id = auth.uid()
$$;

-- Can the signed-in student see this person?
create or replace function public.can_see_profile(p_profile_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_profile_id = auth.uid()
      or public.is_admin()
      or (
        public.is_verified(auth.uid())
        and exists (
          select 1 from public.profiles p
          where p.id = p_profile_id
            and p.college_id is not distinct from public.my_college()
            and p.college_id is not null
        )
      )
$$;

drop policy if exists "profiles readable by signed-in users" on public.profiles;
create policy "profiles visible on campus" on public.profiles for select to authenticated
  using (public.can_see_profile(id));

drop policy if exists "skills readable" on public.skills;
create policy "skills visible on campus" on public.skills for select to authenticated
  using (public.can_see_profile(profile_id));

drop policy if exists "repos readable" on public.repos;
create policy "repos visible on campus" on public.repos for select to authenticated
  using (public.can_see_profile(profile_id));

drop policy if exists "team readable" on public.team_members;
create policy "team visible on campus" on public.team_members for select to authenticated
  using (public.can_see_profile(profile_id));

-- Team sizes stay public with the idea summary, without revealing who.
create or replace function public.idea_team_counts(p_idea_ids uuid[])
returns table (idea_id uuid, members int)
language sql stable security definer set search_path = '' as $$
  select t.idea_id, count(*)::int
  from public.team_members t
  join public.ideas i on i.id = t.idea_id
  where t.idea_id = any(p_idea_ids)
    and t.role = 'member'
    and (i.status <> 'archived' or i.owner_id = auth.uid() or public.is_admin())
  group by t.idea_id
$$;

revoke execute on function public.my_college() from public, anon;
revoke execute on function public.can_see_profile(uuid) from public, anon;
revoke execute on function public.idea_team_counts(uuid[]) from public, anon;
grant execute on function public.my_college() to authenticated, service_role;
grant execute on function public.can_see_profile(uuid) to authenticated, service_role;
grant execute on function public.idea_team_counts(uuid[]) to authenticated, service_role;
