create table if not exists public.user_assignments (
  user_id uuid primary key,
  assignments jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_assignments enable row level security;

grant select, insert, update, delete on public.user_assignments to anon, authenticated;

create policy "temporary shared assignments read"
  on public.user_assignments for select
  using (true);

create policy "temporary shared assignments write"
  on public.user_assignments for insert
  with check (true);

create policy "temporary shared assignments update"
  on public.user_assignments for update
  using (true)
  with check (true);

create policy "temporary shared assignments delete"
  on public.user_assignments for delete
  using (true);
