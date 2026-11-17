-- End-to-end checks for the core rules. Runs in one transaction and rolls back.
-- Usage: psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls_and_flows.sql
begin;

-- Switch the current "request" to a user, the way PostgREST does.
create or replace function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

create or replace function pg_temp.act_as_postgres() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Fails the run unless `sql` raises an error.
create or replace function pg_temp.expect_error(label text, sql text) returns void language plpgsql as $$
begin
  execute sql;
  raise exception 'FAIL (no error): %', label;
exception
  when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
    raise notice 'ok  %  (%)', label, sqlerrm;
  when others then
    raise notice 'ok  %  (%)', label, sqlerrm;
end $$;

create or replace function pg_temp.check(label text, cond boolean) returns void language plpgsql as $$
begin
  if cond is not true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok  %', label;
end $$;

-- Fixture: four users. Signing up creates their profiles via the trigger.
insert into auth.users (id, email, raw_user_meta_data, aud, role)
values
  ('00000000-0000-0000-0000-00000000000a', 'owner@test.local', '{"full_name":"Owner A"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000b', 'builder@test.local', '{"full_name":"Builder B"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-00000000000c', 'outsider@test.local', '{"full_name":"Outsider C"}', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000ad', 'admin@test.local', '{"full_name":"Admin"}', 'authenticated', 'authenticated');
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-0000000000ad';

select pg_temp.check('profile created on sign-up, unverified',
  (select verification_status = 'unverified' from public.profiles where id = '00000000-0000-0000-0000-00000000000a'));

-- A student cannot verify or promote themselves.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_error('student cannot set own verification_status',
  $$update public.profiles set verification_status = 'approved' where id = auth.uid()$$);
select pg_temp.expect_error('student cannot make themselves admin',
  $$update public.profiles set is_admin = true where id = auth.uid()$$);
update public.profiles set mode = 'owner', username = 'owner-a' where id = auth.uid();
select pg_temp.check('student can edit safe columns', (select mode = 'owner' from public.profiles where id = auth.uid()));

-- Unverified students cannot post.
select pg_temp.expect_error('unverified student cannot post an idea',
  $$insert into public.ideas (owner_id, college_id, title, summary, skills_needed, team_size, hours_per_week)
    values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Lab slot alerts',
            'Alerts when a lab slot frees up so students can book it fast.', '{React}', 1, 6)$$);

-- Submit verification -> pending.
insert into public.student_verifications (profile_id, college_id, full_name, department, year, reg_no, id_card_path)
values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Owner A', 'Computer Science', 3, '12345678',
        '00000000-0000-0000-0000-00000000000a/card.jpg');
select pg_temp.check('submitting marks profile pending',
  (select verification_status = 'pending' from public.profiles where id = auth.uid()));
select pg_temp.expect_error('cannot upload an ID path into another user''s folder',
  $$insert into public.student_verifications (profile_id, college_id, full_name, department, year, reg_no, id_card_path)
    values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Owner A', 'CS', 3, '87654321',
            '00000000-0000-0000-0000-00000000000b/card.jpg')$$);

-- Others cannot see it; same reg_no cannot be reused.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('another student cannot read my verification (reg_no stays private)',
  (select count(*) = 0 from public.student_verifications where profile_id = '00000000-0000-0000-0000-00000000000a'));
select pg_temp.expect_error('same registration number cannot back a second account',
  $$insert into public.student_verifications (profile_id, college_id, full_name, department, year, reg_no)
    values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Builder B', 'Electronics', 2, '12345678')$$);
insert into public.student_verifications (profile_id, college_id, full_name, department, year, reg_no)
values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Builder B', 'Electronics', 2, '22223333');
update public.profiles set mode = 'builder', username = 'builder-b' where id = auth.uid();
select pg_temp.expect_error('student cannot review verifications',
  $$select public.review_verification((select id from public.student_verifications where reg_no = '22223333'), 'approved')$$);

-- Admin reviews.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select pg_temp.check('admin sees the queue', (select count(*) = 2 from public.student_verifications where status = 'pending'));
select pg_temp.expect_error('reject needs a reason',
  $$select public.review_verification((select id from public.student_verifications where reg_no = '12345678'), 'rejected', '')$$);
select public.review_verification((select id from public.student_verifications where reg_no = '12345678'), 'approved');
select public.review_verification((select id from public.student_verifications where reg_no = '22223333'), 'approved');
select pg_temp.expect_error('cannot review twice',
  $$select public.review_verification((select id from public.student_verifications where reg_no = '12345678'), 'approved')$$);
select pg_temp.check('approval verifies both students with an expiry',
  (select bool_and(verification_status = 'approved' and verified_until > current_date) from public.profiles
   where id in ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b')));
select pg_temp.check('admin cannot read students'' notifications',
  (select count(*) = 0 from public.notifications));

-- Server writes GitHub skills (as postgres / service role).
select pg_temp.act_as_postgres();
insert into public.skills (profile_id, name, slug, source, score, repo_count, last_pushed_at, evidence)
values ('00000000-0000-0000-0000-00000000000b', 'React', 'react', 'github', public.skill_score(4, now() - interval '6 days', 3),
        4, now() - interval '6 days', '4 original repos, 6 days ago');

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('approval notification reached the student',
  (select count(*) = 1 from public.notifications where kind = 'verification_approved'));
select pg_temp.expect_error('student cannot fake a GitHub skill',
  $$insert into public.skills (profile_id, name, slug, source, score) values (auth.uid(), 'Rust', 'rust', 'github', 99)$$);
insert into public.skills (profile_id, name, slug, source, score) values (auth.uid(), 'UI Design', 'x', 'self', 99);
select pg_temp.check('self-added skill gets flat score 5 and its own slug',
  (select score = 5 and slug = 'ui-design' from public.skills where profile_id = auth.uid() and source = 'self'));

-- Owner posts an idea.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.ideas (owner_id, college_id, title, summary, skills_needed, team_size, hours_per_week)
values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Lab slot alerts',
        'Alerts when a lab slot frees up so students can book it fast.', '{React, "UI Design"}', 1, 6);
select pg_temp.check('owner is on the team and details row exists',
  (select count(*) = 1 from public.team_members t join public.ideas i on i.id = t.idea_id where t.role = 'owner' and i.owner_id = '00000000-0000-0000-0000-00000000000a')
  and (select count(*) = 1 from public.idea_details where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
select pg_temp.check('skill tags normalised to slugs',
  (select skills_needed = '{react,ui-design}' or skills_needed = '{ui-design,react}' from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'));
update public.idea_details set details = 'Full plan: scrape the lab booking page every minute.' where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a');

select pg_temp.check('owner sees builder B ranked with proof',
  (select match_pct > 0 and matched_count = 2 and needed_count = 2
   from public.idea_matches((select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'))
   where profile_id = '00000000-0000-0000-0000-00000000000b'));

-- Builder cannot see matches or full details yet.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_error('builder cannot read matches', $$select * from public.idea_matches((select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'))$$);
select pg_temp.check('builder cannot read full details before joining', (select count(*) = 0 from public.idea_details));
select pg_temp.check('idea is suggested to builder B', exists (select 1 from public.ideas_for_me() f where f.idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));

-- Unverified C cannot apply.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.expect_error('unverified student cannot apply',
  $$insert into public.requests (idea_id, profile_id, type) values ((select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'), auth.uid(), 'application')$$);

-- Owner invites B; only B can accept.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.requests (idea_id, profile_id, type, message)
values ((select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'), '00000000-0000-0000-0000-00000000000b', 'invite', 'Want to build this with me?');
select pg_temp.expect_error('owner cannot accept their own invite',
  $$select public.respond_to_request((select r.id from public.requests r where r.idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a') limit 1), true)$$);

select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_error('builder must agree to the team terms before accepting',
  $$select public.respond_to_request((select r.id from public.requests r where r.idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a') limit 1), true)$$);
select public.respond_to_request((select r.id from public.requests r where r.idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a') limit 1), true, true);
select pg_temp.check('the agreement time is recorded on the request',
  (select builder_agreed_at is not null from public.requests where id = (select r.id from public.requests r where r.idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a') limit 1)));
select pg_temp.check('team formed when full', (select status = 'team_formed' from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a'));
select pg_temp.check('accepted builder can now read full details', (select count(*) = 1 from public.idea_details where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
update public.idea_details set details = 'hacked';  -- RLS: matches 0 rows for a non-owner
select pg_temp.check('builder update did not change details',
  (select details like 'Full plan%' from public.idea_details where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));

select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.check('outsider still cannot read full details', (select count(*) = 0 from public.idea_details));
select pg_temp.check('outsider cannot read others'' requests', (select count(*) = 0 from public.requests));


-- GitHub sync: server-only, identity-safe, upgrades self-added skills.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_error('student cannot call the GitHub sync',
  $$select public.sync_github_profile(auth.uid(), 999000001, 'builder-b', '[]', '[{"name":"Rust","repo_count":9,"last_pushed_at":"2026-11-01T00:00:00Z","stars":0}]')$$);
select pg_temp.act_as_postgres();
set local role service_role;
select public.sync_github_profile('00000000-0000-0000-0000-00000000000b', 999000001, 'Builder-B',
  '[{"github_id":1,"name":"app","url":"https://github.com/builder-b/app","description":null,"main_language":"TypeScript","languages":{"TypeScript":100},"topics":[],"frameworks":["React"],"stars":2,"pushed_at":"2026-11-10T00:00:00Z"}]',
  '[{"name":"TypeScript","repo_count":1,"last_pushed_at":"2026-11-10T00:00:00Z","stars":2},{"name":"UI Design","repo_count":1,"last_pushed_at":"2026-11-10T00:00:00Z","stars":0}]');
reset role;
select pg_temp.check('sync stores repos and links the GitHub account',
  (select count(*) = 1 from public.repos where profile_id = '00000000-0000-0000-0000-00000000000b')
  and (select github_username = 'Builder-B' and github_id = 999000001 from public.profiles where id = '00000000-0000-0000-0000-00000000000b'));
select pg_temp.check('a GitHub-proven skill replaces the self-added one with the same name',
  (select source = 'github' and evidence = '1 original repo' and score > 5 from public.skills
   where profile_id = '00000000-0000-0000-0000-00000000000b' and slug = 'ui-design'));
select pg_temp.check('earlier GitHub skills are replaced, not duplicated',
  (select count(*) = 2 from public.skills where profile_id = '00000000-0000-0000-0000-00000000000b' and source = 'github'));
set local role service_role;
select pg_temp.expect_error('one GitHub account cannot back two students',
  $$select public.sync_github_profile('00000000-0000-0000-0000-00000000000c', 999000001, 'Builder-B', '[]', '[]')$$);
reset role;

-- Campus-only people: unverified students see idea summaries, not people.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000c');
select pg_temp.check('unverified student cannot see another student''s profile',
  (select count(*) = 0 from public.profiles where id = '00000000-0000-0000-0000-00000000000b'));
select pg_temp.check('unverified student cannot see another student''s skills or repos',
  (select count(*) = 0 from public.skills where profile_id = '00000000-0000-0000-0000-00000000000b')
  and (select count(*) = 0 from public.repos where profile_id = '00000000-0000-0000-0000-00000000000b'));
select pg_temp.check('unverified student cannot see who is on a team',
  (select count(*) = 0 from public.team_members));
select pg_temp.check('unverified student still sees idea summaries and team sizes',
  (select count(*) >= 1 from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')
  and (select members = 1 from public.idea_team_counts(array[(select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')])));
select pg_temp.check('a student always sees their own profile',
  (select count(*) = 1 from public.profiles where id = auth.uid()));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check('a verified student on the same campus sees profiles and skills',
  (select count(*) = 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b')
  and (select count(*) >= 1 from public.skills where profile_id = '00000000-0000-0000-0000-00000000000b'));

-- Plan history and leaving teams.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check('saved plan edits are kept as dated versions for the owner',
  (select count(*) >= 1 from public.idea_plan_versions where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('a teammate cannot read the plan history',
  (select count(*) = 0 from public.idea_plan_versions where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
delete from public.team_members where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a') and profile_id = '00000000-0000-0000-0000-00000000000b';
select pg_temp.check('removing a builder reopens a full team',
  (select status = 'open' from public.ideas where id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('the removed builder is told',
  (select count(*) = 1 from public.notifications where kind = 'removed_from_team'));
select pg_temp.check('the removed builder can no longer read the plan',
  (select count(*) = 0 from public.idea_details where idea_id = (select id from public.ideas where owner_id = '00000000-0000-0000-0000-00000000000a')));
select pg_temp.act_as_postgres();
insert into public.ideas (owner_id, college_id, title, summary, skills_needed, team_size, hours_per_week)
values ('00000000-0000-0000-0000-00000000000a', (select id from public.colleges where slug = 'lpu'), 'Second idea', 'A second idea to test asking to join with terms.', '{python}', 2, 4);
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_error('asking to join without agreeing to the terms fails',
  $$insert into public.requests (idea_id, profile_id, type) values ((select id from public.ideas where title = 'Second idea' and owner_id = '00000000-0000-0000-0000-00000000000a'), auth.uid(), 'application')$$);

-- Safety: blocks, daily limits, reports.
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
insert into public.blocks (blocker_id, blocked_id) values (auth.uid(), '00000000-0000-0000-0000-00000000000b');
select pg_temp.check('a blocked student is left out of the owner''s matches',
  not exists (select 1 from public.idea_matches((select id from public.ideas where title = 'Second idea' and owner_id = '00000000-0000-0000-0000-00000000000a')) m where m.profile_id = '00000000-0000-0000-0000-00000000000b'));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('the blocked student cannot see who blocked them',
  (select count(*) = 0 from public.blocks));
select pg_temp.expect_error('a blocked student cannot ask to join the blocker''s idea',
  $$insert into public.requests (idea_id, profile_id, type, builder_agreed_at) values ((select id from public.ideas where title = 'Second idea' and owner_id = '00000000-0000-0000-0000-00000000000a'), auth.uid(), 'application', now())$$);
select pg_temp.expect_error('a student cannot report themselves',
  $$insert into public.reports (reporter_id, target_profile_id, reason) values (auth.uid(), auth.uid(), 'testing a self report')$$);
insert into public.reports (reporter_id, target_profile_id, reason) values (auth.uid(), '00000000-0000-0000-0000-00000000000a', 'Testing the report flow.');
select pg_temp.check('a student can report someone and see their own report',
  (select count(*) = 1 from public.reports where reporter_id = auth.uid()));
select pg_temp.act_as('00000000-0000-0000-0000-00000000000a');
select pg_temp.check('the reported student cannot see the report',
  (select count(*) = 0 from public.reports));
insert into public.ideas (owner_id, college_id, title, summary, skills_needed, team_size, hours_per_week)
select auth.uid(), (select id from public.colleges where slug = 'lpu'), 'Limit idea ' || g, 'An idea posted to test the daily limit.', '{python}', 1, 2
from generate_series(1, 3) g;
select pg_temp.expect_error('a sixth idea in one day is refused',
  $$insert into public.ideas (owner_id, college_id, title, summary, skills_needed, team_size, hours_per_week) values (auth.uid(), (select id from public.colleges where slug = 'lpu'), 'One too many', 'An idea posted to test the daily limit.', '{python}', 1, 2)$$);

-- An admin never sees reports about themselves.
select pg_temp.act_as_postgres();
update public.profiles set is_admin = true where id = '00000000-0000-0000-0000-00000000000b';
insert into public.reports (reporter_id, target_profile_id, reason)
values ('00000000-0000-0000-0000-00000000000c', '00000000-0000-0000-0000-00000000000b', 'Report about an admin, for testing.');
select pg_temp.act_as('00000000-0000-0000-0000-00000000000b');
select pg_temp.check('an admin cannot see a report about themselves',
  not exists (select 1 from public.reports where target_profile_id = auth.uid()));
select pg_temp.act_as('00000000-0000-0000-0000-0000000000ad');
select pg_temp.check('another admin can see it',
  exists (select 1 from public.reports where target_profile_id = '00000000-0000-0000-0000-00000000000b'));
select pg_temp.act_as_postgres();
\echo 'ALL CHECKS PASSED'
rollback;
