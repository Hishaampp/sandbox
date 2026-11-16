-- Local development seed. Production colleges are added by admins.
insert into public.colleges (slug, name, short_name, city)
values ('lpu', 'Lovely Professional University', 'LPU', 'Phagwara, Punjab')
on conflict (slug) do nothing;
