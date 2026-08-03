import { TABLES } from '../constants/database';
import { STORAGE_BUCKETS, supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { FileCategory, Folder, Note, UploadedFile } from '../types/notes';

type NoteRow = Database['public']['Tables']['notes']['Row'];
type FolderRow = Database['public']['Tables']['note_folders']['Row'];
type FileRow = Database['public']['Tables']['note_files']['Row'];

const toNote = (row: NoteRow): Note => ({ id: row.id, title: row.title, content: row.content, folderId: row.folder_id, tags: row.tags, color: row.color as Note['color'], favorite: row.favorite, pinned: row.pinned, trashed: row.trashed, trashedAt: row.trashed_at ?? undefined, createdAt: row.created_at, updatedAt: row.updated_at, lastOpenedAt: row.last_opened_at ?? undefined, attachmentIds: row.attachment_ids });
const toFolder = (row: FolderRow): Folder => ({ id: row.id, name: row.name, createdAt: row.created_at, collapsed: row.collapsed ?? undefined });
async function toFile(row: FileRow): Promise<UploadedFile> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKETS.NOTE_FILES)
    .createSignedUrl(row.storage_path, 60 * 60);

  if (error) throw error;

  return {
    id: row.id,
    noteId: row.note_id,
    name: row.name,
    size: row.size,
    type: row.type,
    extension: row.extension,
    uploadedAt: row.uploaded_at,
    dataURL: data.signedUrl,
    category: row.category as FileCategory,
  };
}

export async function fetchNotes(userId: string): Promise<Note[]> { const { data, error } = await supabase.from(TABLES.NOTES).select('*').eq('user_id', userId); if (error) throw error; return data.map(toNote); }
export async function fetchFolders(userId: string): Promise<Folder[]> { const { data, error } = await supabase.from(TABLES.NOTE_FOLDERS).select('*').eq('user_id', userId); if (error) throw error; return data.map(toFolder); }
export async function fetchNoteFiles(userId: string): Promise<UploadedFile[]> { const { data, error } = await supabase.from(TABLES.NOTE_FILES).select('*').eq('user_id', userId); if (error) throw error; return Promise.all(data.map(toFile)); }
export async function saveNotes(userId: string, notes: Note[]): Promise<void> { if (!notes.length) return; const { error } = await supabase.from(TABLES.NOTES).upsert(notes.map((note) => ({ id: note.id, user_id: userId, title: note.title, content: note.content, folder_id: note.folderId, tags: note.tags, color: note.color, favorite: note.favorite, pinned: note.pinned, trashed: note.trashed, trashed_at: note.trashedAt ?? null, created_at: note.createdAt, updated_at: note.updatedAt, last_opened_at: note.lastOpenedAt ?? null, attachment_ids: note.attachmentIds }))); if (error) throw error; }
export async function deleteNotes(userId: string, ids: string[]): Promise<void> { if (!ids.length) return; const { error } = await supabase.from(TABLES.NOTES).delete().eq('user_id', userId).in('id', ids); if (error) throw error; }
export async function saveFolders(userId: string, folders: Folder[]): Promise<void> { if (!folders.length) return; const { error } = await supabase.from(TABLES.NOTE_FOLDERS).upsert(folders.map((folder) => ({ id: folder.id, user_id: userId, name: folder.name, created_at: folder.createdAt, collapsed: folder.collapsed ?? false }))); if (error) throw error; }
export async function deleteFolders(userId: string, ids: string[]): Promise<void> { if (!ids.length) return; const { error } = await supabase.from(TABLES.NOTE_FOLDERS).delete().eq('user_id', userId).in('id', ids); if (error) throw error; }
export async function uploadNoteFile(userId: string, noteId: string, file: File, record: Omit<UploadedFile, 'dataURL'>): Promise<UploadedFile> { 
  console.info('File upload started.', { userId, noteId, fileName: file.name, fileSize: file.size, fileType: file.type });
  const storagePath = `${userId}/${record.id}-${record.name}`;
  
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKETS.NOTE_FILES).upload(storagePath, file);
  if (uploadError) {
    console.error('Storage upload failed.', { 
      userId, 
      noteId, 
      fileName: file.name, 
      storagePath, 
      errorMessage: uploadError.message, 
      errorCode: uploadError.message.includes('Bucket not found') ? 'BUCKET_NOT_FOUND' : uploadError.message.includes('Permission') ? 'PERMISSION_DENIED' : 'STORAGE_ERROR' 
    });
    
    if (uploadError.message.includes('Bucket not found')) {
      throw new Error('Storage bucket not configured. Please contact support.');
    }
    if (uploadError.message.includes('Permission') || uploadError.message.includes('authorization')) {
      throw new Error('Storage permission denied. You may not have upload rights.');
    }
    if (uploadError.message.includes('size') || uploadError.message.includes('too large')) {
      throw new Error('File exceeds upload limit. Maximum size is 5MB.');
    }
    throw new Error('Storage upload failed. Please try again.');
  }
  
  console.info('Storage upload succeeded.', { userId, noteId, fileName: file.name, storagePath });
  
  const { error } = await supabase.from(TABLES.NOTE_FILES).insert({ 
    id: record.id, 
    user_id: userId, 
    note_id: noteId, 
    name: record.name, 
    size: record.size, 
    type: record.type, 
    extension: record.extension, 
    uploaded_at: record.uploadedAt, 
    storage_path: storagePath, 
    category: record.category 
  });
  if (error) {
    console.error('Database record insertion failed.', { 
      userId, 
      noteId, 
      fileName: file.name, 
      errorMessage: error.message, 
      errorCode: error.code 
    });
    // Attempt to clean up the uploaded file from storage
    await supabase.storage.from(STORAGE_BUCKETS.NOTE_FILES).remove([storagePath]).catch(console.error);
    
    if (error.code === '42501') {
      throw new Error('Database permission denied. Please contact support.');
    }
    throw new Error('Failed to save file record. Please try again.');
  }
  
  console.info('Database record inserted.', { userId, noteId, fileName: file.name, fileId: record.id });
  
  const { data, error: signedUrlError } = await supabase.storage.from(STORAGE_BUCKETS.NOTE_FILES).createSignedUrl(storagePath, 60 * 60);
  if (signedUrlError) {
    console.error('Signed URL generation failed.', { 
      userId, 
      noteId, 
      fileName: file.name, 
      storagePath, 
      errorMessage: signedUrlError.message, 
      errorCode: signedUrlError.message.includes('Permission') ? 'PERMISSION_DENIED' : 'URL_ERROR' 
    });
    
    if (signedUrlError.message.includes('Permission') || signedUrlError.message.includes('authorization')) {
      throw new Error('Storage permission denied for file access.');
    }
    throw new Error('Failed to generate file access URL. Please try again.');
  }
  
  console.info('File upload completed successfully.', { userId, noteId, fileName: file.name, fileId: record.id });
  return { ...record, dataURL: data.signedUrl }; 
}
export async function deleteNoteFiles(userId: string, ids: string[]): Promise<void> { if (!ids.length) return; const { data, error: selectError } = await supabase.from(TABLES.NOTE_FILES).select('storage_path').eq('user_id', userId).in('id', ids); if (selectError) throw selectError; if (data.length) { const { error } = await supabase.storage.from(STORAGE_BUCKETS.NOTE_FILES).remove(data.map((file) => file.storage_path)); if (error) throw error; } const { error } = await supabase.from(TABLES.NOTE_FILES).delete().eq('user_id', userId).in('id', ids); if (error) throw error; }
export async function updateNoteFile(userId: string, file: UploadedFile): Promise<void> { const { error } = await supabase.from(TABLES.NOTE_FILES).update({ name: file.name }).eq('user_id', userId).eq('id', file.id); if (error) throw error; }
