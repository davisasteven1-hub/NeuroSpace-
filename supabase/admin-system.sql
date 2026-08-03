begin;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  added_by uuid references auth.users (id) on delete set null,
  notes text
);

create index if not exists admin_users_created_at_idx on public.admin_users (created_at desc);

alter table public.admin_users enable row level security;

revoke all on public.admin_users from anon;
revoke all on public.admin_users from authenticated;

comment on table public.admin_users is 'Registry of NeuroSpace super administrators.';
comment on column public.admin_users.added_by is 'Auth user id of the administrator who granted access.';
comment on column public.admin_users.notes is 'Optional internal note describing why the account has super admin access.';

-- Seed an administrator by replacing the email below with a real account email after the user exists.
-- insert into public.admin_users (user_id, notes)
-- select id, 'Initial super admin'
-- from auth.users
-- where email = 'admin@example.com'
-- on conflict (user_id) do update set notes = excluded.notes;

commit;


insert into public.admin_users (user_id, notes)
select id, 'b586c009-a5a5-48b4-915a-b29f133bb0ea'
from auth.users
where email = 'davisasteven1@example.com'
on conflict (user_id) do update
set notes = excluded.notes;