-- Support for ideas and matching pages.

-- 1. Match proof lines carry the last push date, so the page can say
--    "4 original repos, 6 days ago" like everywhere else.
create or replace function public.idea_matches(p_idea_id uuid, p_limit int default 30)
returns table (
  profile_id uuid,
  username citext,
  full_name text,
  avatar_url text,
  department text,
  year smallint,
  match_pct int,
  matched_count int,
  needed_count int,
  evidence jsonb,
  last_active_at timestamptz,
  request_status public.request_status
)
language plpgsql stable security definer set search_path = '' as $$
declare
  i public.ideas;
begin
  select * into i from public.ideas where id = p_idea_id;
  if not found then
    raise exception 'Idea not found' using errcode = 'P0002';
  end if;
  if auth.uid() <> i.owner_id and not public.is_admin() then
    raise exception 'Only the idea owner can see matches' using errcode = '42501';
  end if;

  return query
  with needed as (
    select unnest(i.skills_needed) as slug
  ),
  candidates as (
    select p.* from public.profiles p
    where p.college_id = i.college_id
      and p.id <> i.owner_id
      and p.mode is distinct from 'owner'
      and public.is_verified(p.id)
      and not exists (select 1 from public.team_members t where t.idea_id = i.id and t.profile_id = p.id)
  ),
  scored as (
    select c.id,
           avg(least(coalesce(s.score, 0), 40)::numeric / 40) as share,
           count(s.id)::int as matched,
           jsonb_agg(
             jsonb_build_object('skill', s.name, 'source', s.source, 'evidence', s.evidence,
                                'last_pushed_at', s.last_pushed_at)
             order by s.score desc
           ) filter (where s.id is not null) as evidence
    from candidates c
    cross join needed n
    left join public.skills s on s.profile_id = c.id and s.slug = n.slug
    group by c.id
  )
  select c.id, c.username, c.full_name, c.avatar_url, c.department, c.year,
         round(sc.share * 100)::int,
         sc.matched,
         cardinality(i.skills_needed),
         coalesce(sc.evidence, '[]'::jsonb),
         c.last_active_at,
         r.status
  from scored sc
  join candidates c on c.id = sc.id
  left join public.requests r on r.idea_id = i.id and r.profile_id = c.id
  where sc.matched > 0
  order by sc.share desc, c.last_active_at desc
  limit greatest(1, least(p_limit, 100));
end $$;

-- Students who never picked a mode are treated as possible builders (mode is
-- distinct from 'owner' above); only students who chose "owner only" are left out.

-- 2. Skill catalogue: display names and suggestions, from real students' skills.
--    Returns names and counts only, never who has them.
create or replace function public.skill_catalog()
returns table (slug text, name text, students int)
language sql stable security definer set search_path = '' as $$
  select s.slug,
         mode() within group (order by s.name) as name,
         count(distinct s.profile_id)::int as students
  from public.skills s
  group by s.slug
  order by count(distinct s.profile_id) desc, s.slug
  limit 500
$$;

revoke execute on function public.skill_catalog() from public, anon;
grant execute on function public.skill_catalog() to authenticated;
