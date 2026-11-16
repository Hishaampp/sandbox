-- Explicit, least-privilege grants.
-- This Supabase version does not grant table or function access to the API
-- roles by default, so each role gets exactly what the app needs. RLS
-- policies (first migration) still decide which rows each statement can touch.

-- ---------------------------------------------------------------------------
-- service_role: the Next.js server (GitHub sync, ID photo cleanup). Bypasses RLS.
-- ---------------------------------------------------------------------------
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ---------------------------------------------------------------------------
-- anon: signed-out visitors. Only the public list of colleges.
-- ---------------------------------------------------------------------------
grant select on public.colleges to anon;

-- ---------------------------------------------------------------------------
-- authenticated: signed-in students and admins.
-- Column-level UPDATE grants on profiles, ideas and notifications were set
-- in the first migration and are not repeated here.
-- ---------------------------------------------------------------------------
grant select on public.colleges to authenticated;
grant insert, update, delete on public.colleges to authenticated;     -- RLS: admins only

grant select on public.profiles to authenticated;

grant select, insert on public.student_verifications to authenticated;
grant select on public.verification_reviews to authenticated;           -- RLS: admins only

grant select on public.repos to authenticated;
grant select, insert, delete on public.skills to authenticated;         -- RLS: own self-added skills

grant select, insert, delete on public.ideas to authenticated;
grant select, update on public.idea_details to authenticated;           -- RLS: team read, owner write
grant select, delete on public.team_members to authenticated;

grant select, insert on public.requests to authenticated;
grant select on public.notifications to authenticated;
grant select, insert, update on public.reports to authenticated;        -- RLS: update admins only

-- Helpers called inside RLS policies, check constraints and triggers run as
-- the calling user, so they need EXECUTE too. They reveal only booleans or
-- normalised text.
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_verified(uuid) to authenticated;
grant execute on function public.is_team_member(uuid, uuid) to authenticated;
grant execute on function public.is_idea_owner(uuid, uuid) to authenticated;
grant execute on function public.slugify(text) to authenticated, anon;

-- Not callable from the app: the score is computed by the server only.
revoke execute on function public.skill_score(int, timestamptz, int) from authenticated, anon;
