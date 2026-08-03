create table if not exists public.ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation' check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.ai_chats(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 50000),
  created_at timestamptz not null default now()
);

create table if not exists public.ai_document_text (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_file_id text not null references public.note_files(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, note_file_id)
);

create index if not exists ai_chats_user_updated_idx on public.ai_chats (user_id, updated_at desc);
create index if not exists ai_messages_chat_created_idx on public.ai_messages (chat_id, created_at);
create index if not exists ai_messages_user_created_idx on public.ai_messages (user_id, created_at desc);
create index if not exists ai_document_text_user_file_idx on public.ai_document_text (user_id, note_file_id);

create or replace function public.set_ai_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_ai_chats_updated_at on public.ai_chats;
create trigger set_ai_chats_updated_at
before update on public.ai_chats
for each row execute function public.set_ai_updated_at();

drop trigger if exists set_ai_document_text_updated_at on public.ai_document_text;
create trigger set_ai_document_text_updated_at
before update on public.ai_document_text
for each row execute function public.set_ai_updated_at();

alter table public.ai_chats enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_document_text enable row level security;

drop policy if exists "ai chats own rows" on public.ai_chats;
create policy "ai chats own rows" on public.ai_chats
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ai messages own rows" on public.ai_messages;
create policy "ai messages own rows" on public.ai_messages
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "ai document text own rows" on public.ai_document_text;
create policy "ai document text own rows" on public.ai_document_text
for all to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.ai_chats to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select, insert, update, delete on public.ai_document_text to authenticated;
revoke all on public.ai_chats from anon;
revoke all on public.ai_messages from anon;
revoke all on public.ai_document_text from anon;
