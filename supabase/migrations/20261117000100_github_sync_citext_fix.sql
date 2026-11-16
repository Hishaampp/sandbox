-- Fix: citext lives in the public schema (search_path is empty inside the function).
create or replace function public.sync_github_profile(
  p_profile_id uuid,
  p_github_id bigint,
  p_github_username text,
  p_repos jsonb,   -- [{github_id, name, url, description, main_language, languages, topics, frameworks, stars, pushed_at}]
  p_skills jsonb   -- [{name, repo_count, last_pushed_at, stars}]
) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  skill_count integer;
begin
  if p_github_username !~ '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$' then
    raise exception 'Invalid GitHub username' using errcode = '22023';
  end if;

  -- One GitHub account backs one Sandbox profile.
  if exists (select 1 from public.profiles where github_id = p_github_id and id <> p_profile_id) then
    raise exception 'This GitHub account is already linked to another student' using errcode = '23505';
  end if;

  update public.profiles
     set github_id = p_github_id,
         github_username = p_github_username,
         github_synced_at = now(),
         -- Default the public username to the GitHub one when it's free.
         username = coalesce(
           username,
           case when not exists (
             select 1 from public.profiles o where o.username = lower(p_github_username)::public.citext and o.id <> p_profile_id
           ) and lower(p_github_username) ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'
           then lower(p_github_username)::public.citext end
         )
   where id = p_profile_id;
  if not found then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  delete from public.repos where profile_id = p_profile_id;
  insert into public.repos (profile_id, github_id, name, url, description, main_language, languages, topics, frameworks, is_fork, stars, pushed_at)
  select p_profile_id,
         (r ->> 'github_id')::bigint,
         r ->> 'name',
         r ->> 'url',
         nullif(r ->> 'description', ''),
         nullif(r ->> 'main_language', ''),
         coalesce(r -> 'languages', '{}'::jsonb),
         coalesce(array(select jsonb_array_elements_text(r -> 'topics')), '{}'),
         coalesce(array(select jsonb_array_elements_text(r -> 'frameworks')), '{}'),
         false,
         coalesce((r ->> 'stars')::int, 0),
         (r ->> 'pushed_at')::timestamptz
  from jsonb_array_elements(p_repos) r;

  delete from public.skills where profile_id = p_profile_id and source = 'github';
  insert into public.skills (profile_id, name, slug, source, score, repo_count, last_pushed_at, evidence)
  select p_profile_id,
         s ->> 'name',
         public.slugify(s ->> 'name'),
         'github',
         public.skill_score((s ->> 'repo_count')::int, (s ->> 'last_pushed_at')::timestamptz, (s ->> 'stars')::int),
         (s ->> 'repo_count')::int,
         (s ->> 'last_pushed_at')::timestamptz,
         (s ->> 'repo_count') || ' original repo' || case when (s ->> 'repo_count')::int = 1 then '' else 's' end
  from jsonb_array_elements(p_skills) s
  where public.slugify(s ->> 'name') <> ''
  -- A GitHub-proven skill replaces a self-added one with the same name.
  on conflict (profile_id, slug) do update
    set name = excluded.name,
        source = 'github',
        score = excluded.score,
        repo_count = excluded.repo_count,
        last_pushed_at = excluded.last_pushed_at,
        evidence = excluded.evidence;

  get diagnostics skill_count = row_count;
  return skill_count;
end $$;
