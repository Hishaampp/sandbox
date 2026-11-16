-- Sandbox core schema.
-- Principles:
--   * Anything another student must never see (registration number, ID photo)
--     lives in its own table with owner/admin-only access. RLS is row-level,
--     so a private column on a public table would leak.
--   * Anything that must not be faked (verification status, GitHub skills,
--     admin flag) cannot be written by the student. Column-level grants plus
--     security-definer functions enforce this, not the UI.
--   * Business rules (who may respond to a request, when a team is formed,
--     match scoring) live here, in the database.

create extension if not exists citext;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.verification_status as enum ('unverified', 'pending', 'approved', 'rejected');
create type public.user_mode as enum ('owner', 'builder', 'both');
create type public.skill_source as enum ('github', 'self');
create type public.idea_status as enum ('open', 'team_formed', 'in_progress', 'completed', 'archived');
create type public.request_type as enum ('invite', 'application');
create type public.request_status as enum ('pending', 'accepted', 'declined', 'withdrawn');
create type public.review_decision as enum ('approved', 'rejected');
create type public.team_role as enum ('owner', 'member');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.slugify(value text)
returns text language sql immutable as $$
  select trim(both '-' from regexp_replace(lower(coalesce(value, '')), '[^a-z0-9+#.]+', '-', 'g'))
$$;

-- ---------------------------------------------------------------------------
-- Colleges (multi-college ready; LPU is seeded first)
-- ---------------------------------------------------------------------------
create table public.colleges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = public.slugify(slug)),
  name text not null,
  short_name text not null,
  city text,
  reg_no_pattern text,             -- optional regex the registration number must match
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger colleges_updated_at before update on public.colleges
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profiles: public face of a student. Nothing private lives here.
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext unique check (username ~ '^[a-z0-9](?:[a-z0-9-]{1,28}[a-z0-9])$'),
  full_name text not null default '' check (char_length(full_name) <= 120),
  avatar_url text,
  college_id uuid references public.colleges (id),
  department text check (char_length(department) <= 120),
  year smallint check (year between 1 and 6),
  mode public.user_mode,
  bio text check (char_length(bio) <= 400),
  portfolio_url text check (portfolio_url ~ '^https://'),
  -- Set only by the server / admins (see grants below).
  verification_status public.verification_status not null default 'unverified',
  verified_until date,
  is_admin boolean not null default false,
  github_id bigint unique,
  github_username text,
  github_synced_at timestamptz,
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create index profiles_college_idx on public.profiles (college_id) where verification_status = 'approved';

-- Create a profile row when someone signs in for the first time.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role / status helpers used by policies. Security definer so they can read
-- profiles without recursing through profiles' own RLS.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false)
$$;

create or replace function public.is_verified(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid
      and p.verification_status = 'approved'
      and (p.verified_until is null or p.verified_until >= current_date)
  )
$$;

-- ---------------------------------------------------------------------------
-- Student verification (private): one registration number, one account.
-- ---------------------------------------------------------------------------
create table public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  college_id uuid not null references public.colleges (id),
  method text not null default 'id_card' check (method in ('id_card', 'sso')),
  full_name text not null check (char_length(full_name) between 2 and 120),
  department text not null check (char_length(department) between 2 and 120),
  year smallint not null check (year between 1 and 6),
  reg_no text not null check (reg_no ~ '^[A-Za-z0-9/-]{4,24}$'),
  id_card_path text,                 -- cleared once the photo is deleted
  card_valid_until date,
  status public.verification_status not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger student_verifications_updated_at before update on public.student_verifications
  for each row execute function public.set_updated_at();
-- A registration number can back only one approved or pending account per college.
create unique index student_verifications_reg_no_live
  on public.student_verifications (college_id, upper(reg_no))
  where status in ('pending', 'approved');
-- A student has at most one open submission at a time.
create unique index student_verifications_one_pending
  on public.student_verifications (profile_id) where status = 'pending';
create index student_verifications_queue on public.student_verifications (submitted_at)
  where status = 'pending';

-- Submitting marks the profile pending.
create or replace function public.on_verification_submitted()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles
     set verification_status = 'pending',
         college_id = new.college_id,
         department = new.department,
         year = new.year,
         full_name = case when full_name = '' then new.full_name else full_name end
   where id = new.profile_id
     and verification_status <> 'approved';
  return new;
end $$;
create trigger student_verifications_submitted after insert on public.student_verifications
  for each row execute function public.on_verification_submitted();

create table public.verification_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_id uuid not null references public.student_verifications (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  admin_id uuid not null references public.profiles (id),
  decision public.review_decision not null,
  reason text,
  created_at timestamptz not null default now(),
  check (decision = 'approved' or char_length(coalesce(reason, '')) >= 3)
);

-- Admin decision. The ID photo itself is deleted by the server right after
-- (storage objects cannot be removed from SQL); id_card_path is cleared here.
create or replace function public.review_verification(
  p_verification_id uuid,
  p_decision public.review_decision,
  p_reason text default null
) returns public.student_verifications
language plpgsql security definer set search_path = '' as $$
declare
  v public.student_verifications;
begin
  if not public.is_admin() then
    raise exception 'Only admins can review verifications' using errcode = '42501';
  end if;

  select * into v from public.student_verifications
   where id = p_verification_id for update;
  if not found then
    raise exception 'Verification not found' using errcode = 'P0002';
  end if;
  if v.status <> 'pending' then
    raise exception 'This verification was already reviewed' using errcode = 'P0001';
  end if;
  if p_decision = 'rejected' and char_length(coalesce(trim(p_reason), '')) < 3 then
    raise exception 'A reason is required to reject' using errcode = '22023';
  end if;

  update public.student_verifications
     set status = p_decision::text::public.verification_status,
         rejection_reason = case when p_decision = 'rejected' then trim(p_reason) end,
         reviewed_at = now()
   where id = v.id
   returning * into v;

  insert into public.verification_reviews (verification_id, profile_id, admin_id, decision, reason)
  values (v.id, v.profile_id, auth.uid(), p_decision, nullif(trim(p_reason), ''));

  update public.profiles
     set verification_status = p_decision::text::public.verification_status,
         verified_until = case when p_decision = 'approved'
                               then coalesce(v.card_valid_until, (current_date + interval '1 year')::date)
                               else verified_until end,
         full_name = case when p_decision = 'approved' then v.full_name else full_name end
   where id = v.profile_id;

  insert into public.notifications (profile_id, kind, payload)
  values (v.profile_id,
          case when p_decision = 'approved' then 'verification_approved' else 'verification_rejected' end,
          jsonb_build_object('reason', v.rejection_reason));

  return v;
end $$;

-- Called by the server after it deletes the photo from storage.
create or replace function public.clear_id_card_path(p_verification_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can do this' using errcode = '42501';
  end if;
  update public.student_verifications set id_card_path = null
   where id = p_verification_id and status <> 'pending';
end $$;

-- ---------------------------------------------------------------------------
-- GitHub repos and skills (written by the server only)
-- ---------------------------------------------------------------------------
create table public.repos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  github_id bigint not null,
  name text not null,
  url text not null,
  description text,
  main_language text,
  languages jsonb not null default '{}'::jsonb,   -- {"TypeScript": 12345, ...}
  topics text[] not null default '{}',
  frameworks text[] not null default '{}',
  is_fork boolean not null default false,
  stars integer not null default 0,
  pushed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, github_id)
);
create trigger repos_updated_at before update on public.repos
  for each row execute function public.set_updated_at();

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  slug text not null check (slug = public.slugify(slug) and slug <> ''),
  source public.skill_source not null,
  score integer not null default 0 check (score >= 0),
  repo_count integer not null default 0,
  last_pushed_at timestamptz,
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, slug)
);
create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();
create index skills_slug_idx on public.skills (slug, score desc);

-- Self-added skills: slug and flat score are set here, never by the client.
create or replace function public.prepare_self_skill()
returns trigger language plpgsql as $$
begin
  if new.source = 'self' then
    new.slug := public.slugify(new.name);
    new.score := 5;
    new.repo_count := 0;
    new.last_pushed_at := null;
    new.evidence := 'Self-added';
  end if;
  return new;
end $$;
create trigger skills_prepare_self before insert or update on public.skills
  for each row execute function public.prepare_self_skill();

-- Score from the plan: 10 per original repo, +15 if pushed in the last 90 days
-- (+5 if in the last year), +1 per star up to 10.
create or replace function public.skill_score(p_repo_count int, p_last_push timestamptz, p_stars int)
returns int language sql immutable as $$
  select 10 * coalesce(p_repo_count, 0)
       + case
           when p_last_push >= now() - interval '90 days' then 15
           when p_last_push >= now() - interval '1 year' then 5
           else 0
         end
       + least(coalesce(p_stars, 0), 10)
$$;

-- ---------------------------------------------------------------------------
-- Ideas
-- ---------------------------------------------------------------------------
create table public.ideas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  college_id uuid not null references public.colleges (id),
  title text not null check (char_length(title) between 4 and 90),
  summary text not null check (char_length(summary) between 20 and 400),
  skills_needed text[] not null check (cardinality(skills_needed) between 1 and 8),
  team_size smallint not null check (team_size between 1 and 12),
  hours_per_week smallint not null check (hours_per_week between 1 and 40),
  reward text check (char_length(reward) <= 120),
  status public.idea_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger ideas_updated_at before update on public.ideas
  for each row execute function public.set_updated_at();
create index ideas_feed_idx on public.ideas (college_id, status, created_at desc);
create index ideas_skills_idx on public.ideas using gin (skills_needed);

-- Normalise skill tags to slugs.
create or replace function public.prepare_idea()
returns trigger language plpgsql as $$
begin
  new.skills_needed := array(
    select distinct public.slugify(s) from unnest(new.skills_needed) s where public.slugify(s) <> ''
  );
  return new;
end $$;
create trigger ideas_prepare before insert or update of skills_needed on public.ideas
  for each row execute function public.prepare_idea();

-- Full plan: visible to the team only.
create table public.idea_details (
  idea_id uuid primary key references public.ideas (id) on delete cascade,
  details text not null default '' check (char_length(details) <= 10000),
  updated_at timestamptz not null default now()
);
create trigger idea_details_updated_at before update on public.idea_details
  for each row execute function public.set_updated_at();

create table public.team_members (
  idea_id uuid not null references public.ideas (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.team_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (idea_id, profile_id)
);
create index team_members_profile_idx on public.team_members (profile_id);

create or replace function public.is_team_member(p_idea_id uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.team_members t where t.idea_id = p_idea_id and t.profile_id = uid)
$$;

create or replace function public.is_idea_owner(p_idea_id uuid, uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.ideas i where i.id = p_idea_id and i.owner_id = uid)
$$;

-- The owner joins their own team, and the details row is created.
create or replace function public.on_idea_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.team_members (idea_id, profile_id, role) values (new.id, new.owner_id, 'owner');
  insert into public.idea_details (idea_id) values (new.id) on conflict do nothing;
  return new;
end $$;
create trigger ideas_created after insert on public.ideas
  for each row execute function public.on_idea_created();

-- ---------------------------------------------------------------------------
-- Requests: invites (owner -> builder) and applications (builder -> owner)
-- ---------------------------------------------------------------------------
create table public.requests (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,  -- the builder
  type public.request_type not null,
  message text check (char_length(message) <= 600),
  status public.request_status not null default 'pending',
  responded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idea_id, profile_id)
);
create trigger requests_updated_at before update on public.requests
  for each row execute function public.set_updated_at();
create index requests_profile_idx on public.requests (profile_id, status);
create index requests_idea_idx on public.requests (idea_id, status);

-- Check who may create a request, and notify the other side.
create or replace function public.on_request_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  i public.ideas;
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

  insert into public.notifications (profile_id, kind, payload)
  values (
    case when new.type = 'invite' then new.profile_id else i.owner_id end,
    case when new.type = 'invite' then 'invite_received' else 'application_received' end,
    jsonb_build_object('request_id', new.id, 'idea_id', i.id, 'idea_title', i.title)
  );
  return new;
end $$;
create trigger requests_created before insert on public.requests
  for each row execute function public.on_request_created();

-- Accept or decline. Invites are answered by the builder, applications by the owner.
create or replace function public.respond_to_request(p_request_id uuid, p_accept boolean)
returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  r public.requests;
  i public.ideas;
  members int;
begin
  select * into r from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  select * into i from public.ideas where id = r.idea_id for update;

  if (r.type = 'invite' and auth.uid() <> r.profile_id)
     or (r.type = 'application' and auth.uid() <> i.owner_id) then
    raise exception 'You cannot answer this request' using errcode = '42501';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request was already answered' using errcode = 'P0001';
  end if;

  if p_accept then
    if i.status <> 'open' then
      raise exception 'This team is already complete' using errcode = 'P0001';
    end if;
    insert into public.team_members (idea_id, profile_id) values (i.id, r.profile_id)
      on conflict do nothing;
    select count(*) into members from public.team_members where idea_id = i.id and role = 'member';
    if members >= i.team_size then
      update public.ideas set status = 'team_formed' where id = i.id;
    end if;
  end if;

  update public.requests
     set status = case when p_accept then 'accepted'::public.request_status else 'declined' end,
         responded_at = now()
   where id = r.id
   returning * into r;

  insert into public.notifications (profile_id, kind, payload)
  values (
    case when r.type = 'invite' then i.owner_id else r.profile_id end,
    case when p_accept then 'request_accepted' else 'request_declined' end,
    jsonb_build_object('request_id', r.id, 'idea_id', i.id, 'idea_title', i.title)
  );
  return r;
end $$;

create or replace function public.withdraw_request(p_request_id uuid)
returns public.requests
language plpgsql security definer set search_path = '' as $$
declare
  r public.requests;
  i public.ideas;
begin
  select * into r from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'Request not found' using errcode = 'P0002';
  end if;
  select * into i from public.ideas where id = r.idea_id;
  if (r.type = 'invite' and auth.uid() <> i.owner_id)
     or (r.type = 'application' and auth.uid() <> r.profile_id) then
    raise exception 'You cannot withdraw this request' using errcode = '42501';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request was already answered' using errcode = 'P0001';
  end if;
  update public.requests set status = 'withdrawn', responded_at = now()
   where id = r.id returning * into r;
  return r;
end $$;

-- ---------------------------------------------------------------------------
-- Matching: builders ranked for an idea, with the proof line per skill.
-- Per needed skill: least(score, 40) / 40. Average -> percentage.
-- ---------------------------------------------------------------------------
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
      and p.mode in ('builder', 'both')
      and public.is_verified(p.id)
      and not exists (select 1 from public.team_members t where t.idea_id = i.id and t.profile_id = p.id)
  ),
  scored as (
    select c.id,
           avg(least(coalesce(s.score, 0), 40)::numeric / 40) as share,
           count(s.id)::int as matched,
           jsonb_agg(
             jsonb_build_object('skill', s.name, 'source', s.source, 'evidence', s.evidence)
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

-- Ideas ranked for the signed-in builder.
create or replace function public.ideas_for_me(p_limit int default 30)
returns table (idea_id uuid, match_pct int, matched_count int, needed_count int)
language sql stable security definer set search_path = '' as $$
  select i.id,
         round(avg(least(coalesce(s.score, 0), 40)::numeric / 40) * 100)::int,
         count(s.id)::int,
         cardinality(i.skills_needed)
  from public.ideas i
  cross join lateral unnest(i.skills_needed) n(slug)
  left join public.skills s on s.profile_id = auth.uid() and s.slug = n.slug
  where i.status = 'open'
    and i.owner_id <> auth.uid()
    and i.college_id = (select college_id from public.profiles where id = auth.uid())
  group by i.id
  having count(s.id) > 0
  order by 2 desc, max(i.created_at) desc
  limit greatest(1, least(p_limit, 100))
$$;

-- ---------------------------------------------------------------------------
-- Notifications and reports
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_inbox_idx on public.notifications (profile_id, created_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete cascade,
  target_idea_id uuid references public.ideas (id) on delete cascade,
  reason text not null check (char_length(reason) between 5 and 600),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id),
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  check (num_nonnulls(target_profile_id, target_idea_id) = 1)
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.colleges enable row level security;
alter table public.profiles enable row level security;
alter table public.student_verifications enable row level security;
alter table public.verification_reviews enable row level security;
alter table public.repos enable row level security;
alter table public.skills enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_details enable row level security;
alter table public.team_members enable row level security;
alter table public.requests enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

-- Colleges: public list.
create policy "colleges readable" on public.colleges for select using (true);
create policy "colleges admin write" on public.colleges for all
  using (public.is_admin()) with check (public.is_admin());

-- Profiles: any signed-in user can browse; you edit only safe columns of your own.
create policy "profiles readable by signed-in users" on public.profiles for select
  to authenticated using (true);
create policy "profiles self update" on public.profiles for update
  to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update
  to authenticated using (public.is_admin()) with check (public.is_admin());
revoke update on public.profiles from authenticated, anon;
grant update (username, full_name, avatar_url, mode, bio, portfolio_url, last_active_at)
  on public.profiles to authenticated;

-- Verifications: the student sees and submits their own; admins see all.
create policy "verifications own read" on public.student_verifications for select
  to authenticated using (profile_id = auth.uid() or public.is_admin());
create policy "verifications own submit" on public.student_verifications for insert
  to authenticated with check (
    profile_id = auth.uid()
    and status = 'pending'
    and not public.is_verified(auth.uid())
    and (id_card_path is null or id_card_path like auth.uid()::text || '/%')
  );
revoke update, delete on public.student_verifications from authenticated, anon;

create policy "reviews admin read" on public.verification_reviews for select
  to authenticated using (public.is_admin());
revoke insert, update, delete on public.verification_reviews from authenticated, anon;

-- Repos & skills: readable by signed-in users; GitHub data written by the server only.
create policy "repos readable" on public.repos for select to authenticated using (true);
revoke insert, update, delete on public.repos from authenticated, anon;

create policy "skills readable" on public.skills for select to authenticated using (true);
create policy "self skills insert" on public.skills for insert to authenticated
  with check (profile_id = auth.uid() and source = 'self');
create policy "self skills delete" on public.skills for delete to authenticated
  using (profile_id = auth.uid() and source = 'self');
revoke update on public.skills from authenticated, anon;

-- Ideas: summaries readable by signed-in users; only verified students post.
create policy "ideas readable" on public.ideas for select to authenticated
  using (status <> 'archived' or owner_id = auth.uid() or public.is_admin());
create policy "ideas verified insert" on public.ideas for insert to authenticated
  with check (
    owner_id = auth.uid()
    and public.is_verified(auth.uid())
    and college_id = (select college_id from public.profiles where id = auth.uid())
    and status = 'open'
  );
create policy "ideas owner update" on public.ideas for update to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());
revoke update on public.ideas from authenticated, anon;
grant update (title, summary, skills_needed, team_size, hours_per_week, reward, status)
  on public.ideas to authenticated;
create policy "ideas owner delete" on public.ideas for delete to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- Details: team only.
create policy "details team read" on public.idea_details for select to authenticated
  using (public.is_team_member(idea_id) or public.is_admin());
create policy "details owner write" on public.idea_details for update to authenticated
  using (public.is_idea_owner(idea_id)) with check (public.is_idea_owner(idea_id));
revoke insert, delete on public.idea_details from authenticated, anon;

-- Team members: visible to signed-in users (the team is shown on the idea page).
create policy "team readable" on public.team_members for select to authenticated using (true);
create policy "team owner remove" on public.team_members for delete to authenticated
  using ((public.is_idea_owner(idea_id) and role = 'member') or (profile_id = auth.uid() and role = 'member'));
revoke insert, update on public.team_members from authenticated, anon;

-- Requests: visible to the builder and the owner.
create policy "requests parties read" on public.requests for select to authenticated
  using (profile_id = auth.uid() or public.is_idea_owner(idea_id) or public.is_admin());
create policy "requests create" on public.requests for insert to authenticated
  with check (
    status = 'pending'
    and public.is_verified(auth.uid())
    and (
      (type = 'application' and profile_id = auth.uid())
      or (type = 'invite' and public.is_idea_owner(idea_id))
    )
  );
revoke update, delete on public.requests from authenticated, anon;

-- Notifications: your own; you may only mark them read.
create policy "notifications own read" on public.notifications for select to authenticated
  using (profile_id = auth.uid());
create policy "notifications own update" on public.notifications for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
revoke insert, delete, update on public.notifications from authenticated, anon;
grant update (read_at) on public.notifications to authenticated;

-- Reports: anyone signed in can report; admins read and resolve.
create policy "reports create" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "reports admin read" on public.reports for select to authenticated
  using (public.is_admin() or reporter_id = auth.uid());
create policy "reports admin update" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Functions: only signed-in users may call the RPCs.
revoke execute on function public.review_verification(uuid, public.review_decision, text) from public, anon;
revoke execute on function public.clear_id_card_path(uuid) from public, anon;
revoke execute on function public.respond_to_request(uuid, boolean) from public, anon;
revoke execute on function public.withdraw_request(uuid) from public, anon;
revoke execute on function public.idea_matches(uuid, int) from public, anon;
revoke execute on function public.ideas_for_me(int) from public, anon;
grant execute on function public.review_verification(uuid, public.review_decision, text) to authenticated;
grant execute on function public.clear_id_card_path(uuid) to authenticated;
grant execute on function public.respond_to_request(uuid, boolean) to authenticated;
grant execute on function public.withdraw_request(uuid) to authenticated;
grant execute on function public.idea_matches(uuid, int) to authenticated;
grant execute on function public.ideas_for_me(int) to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: private bucket for ID card photos.
-- Path: <user id>/<file>. Students upload their own; only admins read/delete.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('id-cards', 'id-cards', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "id cards own upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'id-cards' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "id cards admin read" on storage.objects for select to authenticated
  using (bucket_id = 'id-cards' and public.is_admin());
create policy "id cards admin delete" on storage.objects for delete to authenticated
  using (bucket_id = 'id-cards' and public.is_admin());
