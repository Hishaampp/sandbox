-- Idea protection: team agreement, plan history, removing or leaving a team.

-- 1. Team agreement ----------------------------------------------------------
-- A builder agrees that the idea belongs to its owner and that the full plan
-- stays inside the team, before asking to join or accepting an invite.
alter table public.requests add column if not exists builder_agreed_at timestamptz;

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

  if new.type = 'application' then
    if new.builder_agreed_at is null then
      raise exception 'Agree to the team terms before asking to join' using errcode = 'P0001';
    end if;
    new.builder_agreed_at := now(); -- the server's clock, not the client's
  else
    new.builder_agreed_at := null;  -- an invite is agreed when the builder accepts it
  end if;

  insert into public.notifications (profile_id, kind, payload)
  values (
    case when new.type = 'invite' then new.profile_id else i.owner_id end,
    case when new.type = 'invite' then 'invite_received' else 'application_received' end,
    jsonb_build_object('request_id', new.id, 'idea_id', i.id, 'idea_title', i.title)
  );
  return new;
end $$;

drop function if exists public.respond_to_request(uuid, boolean);
create or replace function public.respond_to_request(p_request_id uuid, p_accept boolean, p_agreed boolean default false)
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
  if p_accept and r.type = 'invite' and not p_agreed then
    raise exception 'Agree to the team terms before accepting' using errcode = 'P0001';
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
         responded_at = now(),
         builder_agreed_at = case when p_accept and r.type = 'invite' then now() else builder_agreed_at end
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

revoke execute on function public.respond_to_request(uuid, boolean, boolean) from public, anon;
grant execute on function public.respond_to_request(uuid, boolean, boolean) to authenticated, service_role;

-- 2. Plan history --------------------------------------------------------------
-- Every saved change to the full plan is kept with its time: dated proof of
-- what the owner wrote, and when. Only the owner (and admins) can read it.
create table if not exists public.idea_plan_versions (
  id uuid primary key default gen_random_uuid(),
  idea_id uuid not null references public.ideas (id) on delete cascade,
  details text not null,
  edited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idea_plan_versions_idea_idx on public.idea_plan_versions (idea_id, created_at desc);

create or replace function public.on_plan_saved()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.details <> '' and (tg_op = 'INSERT' or new.details is distinct from old.details) then
    insert into public.idea_plan_versions (idea_id, details, edited_by)
    values (new.idea_id, new.details, auth.uid());
  end if;
  return new;
end $$;
drop trigger if exists idea_details_versioned on public.idea_details;
create trigger idea_details_versioned after insert or update of details on public.idea_details
  for each row execute function public.on_plan_saved();

-- Plans written before this migration get their current text as the first version.
insert into public.idea_plan_versions (idea_id, details, edited_by, created_at)
select d.idea_id, d.details, i.owner_id, d.updated_at
from public.idea_details d join public.ideas i on i.id = d.idea_id
where d.details <> ''
  and not exists (select 1 from public.idea_plan_versions v where v.idea_id = d.idea_id);

alter table public.idea_plan_versions enable row level security;
create policy "plan history owner read" on public.idea_plan_versions for select to authenticated
  using (public.is_idea_owner(idea_id) or public.is_admin());
revoke insert, update, delete on public.idea_plan_versions from authenticated, anon;
grant select on public.idea_plan_versions to authenticated;
grant select, insert, update, delete on public.idea_plan_versions to service_role;

-- 3. Removing or leaving a team -----------------------------------------------------
-- The delete policy already lets the owner remove a builder and a builder leave.
-- Afterwards, a full team reopens and the other side is told.
create or replace function public.on_team_member_removed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  i public.ideas;
begin
  if old.role <> 'member' then
    return old;
  end if;
  select * into i from public.ideas where id = old.idea_id;
  if i.status = 'team_formed' then
    update public.ideas set status = 'open' where id = i.id;
  end if;
  insert into public.notifications (profile_id, kind, payload)
  values (
    case when auth.uid() = old.profile_id then i.owner_id else old.profile_id end,
    case when auth.uid() = old.profile_id then 'builder_left' else 'removed_from_team' end,
    jsonb_build_object('idea_id', i.id, 'idea_title', i.title)
  );
  return old;
end $$;
drop trigger if exists team_member_removed on public.team_members;
create trigger team_member_removed after delete on public.team_members
  for each row execute function public.on_team_member_removed();
