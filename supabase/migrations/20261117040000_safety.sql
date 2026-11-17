-- Safety: blocking, rate limits, and the reports queue.

-- 1. Blocks --------------------------------------------------------------------
create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
alter table public.blocks enable row level security;
create policy "blocks own read" on public.blocks for select to authenticated using (blocker_id = auth.uid());
create policy "blocks own insert" on public.blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "blocks own delete" on public.blocks for delete to authenticated using (blocker_id = auth.uid());
grant select, insert, delete on public.blocks to authenticated;
grant select, insert, update, delete on public.blocks to service_role;

create or replace function public.is_blocked_between(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  )
$$;
revoke execute on function public.is_blocked_between(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_between(uuid, uuid) to authenticated, service_role;

-- 2. Requests: blocks and a daily limit ------------------------------------------
create or replace function public.on_request_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  i public.ideas;
  sent_today int;
begin
  select * into i from public.ideas where id = new.idea_id;
  if i.status <> 'open' then
    raise exception 'This idea is not taking new members' using errcode = 'P0001';
  end if;
  if new.profile_id = i.owner_id then
    raise exception 'You already own this idea' using errcode = 'P0001';
  end if;
  if not public.is_verified(new.profile_id) then
    raise exception 'Only verified students can join a team' using errcode = '42501';
  end if;
  if (select college_id from public.profiles where id = new.profile_id) is distinct from i.college_id then
    raise exception 'This idea is for another campus' using errcode = '42501';
  end if;
  if public.is_blocked_between(i.owner_id, new.profile_id) then
    raise exception 'You can''t send a request to this student' using errcode = '42501';
  end if;

  -- At most 20 invites or join requests a day from one student.
  select count(*) into sent_today
  from public.requests r
  join public.ideas ri on ri.id = r.idea_id
  where r.created_at > now() - interval '1 day'
    and (
      (r.type = 'application' and r.profile_id = auth.uid())
      or (r.type = 'invite' and ri.owner_id = auth.uid())
    );
  if sent_today >= 20 then
    raise exception 'You''ve sent 20 requests today. Try again tomorrow.' using errcode = 'P0001';
  end if;

  if new.type = 'application' then
    if new.builder_agreed_at is null then
      raise exception 'Agree to the team terms before asking to join' using errcode = 'P0001';
    end if;
    new.builder_agreed_at := now();
  else
    new.builder_agreed_at := null;
  end if;

  insert into public.notifications (profile_id, kind, payload)
  values (
    case when new.type = 'invite' then new.profile_id else i.owner_id end,
    case when new.type = 'invite' then 'invite_received' else 'application_received' end,
    jsonb_build_object('request_id', new.id, 'idea_id', i.id, 'idea_title', i.title)
  );
  return new;
end $$;

-- 3. Ideas: a daily limit -----------------------------------------------------------
create or replace function public.limit_new_ideas()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.ideas where owner_id = new.owner_id and created_at > now() - interval '1 day') >= 5 then
    raise exception 'You''ve posted 5 ideas today. Try again tomorrow.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists ideas_daily_limit on public.ideas;
create trigger ideas_daily_limit before insert on public.ideas
  for each row execute function public.limit_new_ideas();

-- 4. Matches leave out blocked students (either direction) ---------------------------
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
      and not public.is_blocked_between(i.owner_id, p.id)
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

-- 5. Reports: one open report per reporter and target, a daily limit -------------------
create unique index if not exists reports_one_open_profile
  on public.reports (reporter_id, target_profile_id) where status = 'open' and target_profile_id is not null;
create unique index if not exists reports_one_open_idea
  on public.reports (reporter_id, target_idea_id) where status = 'open' and target_idea_id is not null;

create or replace function public.limit_reports()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.target_profile_id = new.reporter_id then
    raise exception 'You can''t report yourself' using errcode = 'P0001';
  end if;
  if (select count(*) from public.reports where reporter_id = new.reporter_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'You''ve sent 10 reports today. The coordinator will review them.' using errcode = 'P0001';
  end if;
  return new;
end $$;
drop trigger if exists reports_daily_limit on public.reports;
create trigger reports_daily_limit before insert on public.reports
  for each row execute function public.limit_reports();
