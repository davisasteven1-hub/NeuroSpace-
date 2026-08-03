-- Storage bucket setup for NeuroSpace
-- This creates the note-files bucket and sets up RLS policies

-- Create the note-files bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('note-files', 'note-files', false, 5242880, ARRAY[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
])
on conflict (id) do update set
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

-- Enable RLS on storage
alter table storage.objects enable row level security;

-- Policy: Authenticated users can upload files to their own folder
-- Folder structure: {user_id}/{filename}
drop policy if exists "Users can upload to their own folder" on storage.objects;
create policy "Users can upload to their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'note-files' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can read their own files
drop policy if exists "Users can read their own files" on storage.objects;
create policy "Users can read their own files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'note-files' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Authenticated users can delete their own files
drop policy if exists "Users can delete their own files" on storage.objects;
create policy "Users can delete their own files"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'note-files' 
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Grant necessary permissions
grant usage on schema storage to authenticated;
grant usage on schema storage to anon;
grant all on table storage.buckets to authenticated;
grant all on table storage.buckets to anon;
grant all on table storage.objects to authenticated;
grant all on table storage.objects to anon;
