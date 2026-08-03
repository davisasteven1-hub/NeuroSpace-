import { TABLES } from '../constants/database';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { Note, UploadedFile } from '../types/notes';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type NoteFileRow = Database['public']['Tables']['note_files']['Row'];

const toNote = (note: NoteRow): Note => ({
  id: note.id,
  title: note.title,
  content: note.content,
  folderId: note.folder_id,
  tags: note.tags,
  color: note.color as Note['color'],
  favorite: note.favorite,
  pinned: note.pinned,
  trashed: note.trashed,
  trashedAt: note.trashed_at ?? undefined,
  createdAt: note.created_at,
  updatedAt: note.updated_at,
  lastOpenedAt: note.last_opened_at ?? undefined,
  attachmentIds: note.attachment_ids,
});

const toUploadedFile = (file: NoteFileRow): UploadedFile => ({
  id: file.id,
  noteId: file.note_id,
  name: file.name,
  size: file.size,
  type: file.type,
  extension: file.extension,
  uploadedAt: file.uploaded_at,
  dataURL: file.storage_path,
  category: file.category as UploadedFile['category'],
});

export async function fetchDashboardNotes(userId: string): Promise<Note[]> {
  const { data, error } = await supabase.from(TABLES.NOTES).select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(toNote);
}

export async function fetchDashboardFiles(userId: string): Promise<UploadedFile[]> {
  const { data, error } = await supabase.from(TABLES.NOTE_FILES).select('*').eq('user_id', userId);
  if (error) throw error;
  return data.map(toUploadedFile);
}
