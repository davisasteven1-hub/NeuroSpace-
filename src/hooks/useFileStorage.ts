import { useCallback, useEffect, useRef, useState } from 'react';
import type { UploadedFile } from '../types/notes';
import { generateId, getExtension, categorizeFile, isFileTooLarge } from '../utils/notesUtils';
import { deleteNoteFiles, fetchNoteFiles, updateNoteFile, uploadNoteFile } from '../services/notesService';
import { useAuth } from '../context/AuthContext';

interface UseFileStorageResult { files: UploadedFile[]; setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>; loading: boolean; uploadFiles: (noteId: string, fileList: FileList | File[]) => Promise<{ succeeded: UploadedFile[]; rejected: string[]; inlineFallbackFiles: File[] }>; deleteFile: (fileId: string) => void; renameFile: (fileId: string, newName: string) => void; getFilesForNote: (noteId: string) => UploadedFile[]; }

export function useFileStorage(): UseFileStorageResult {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const previousFiles = useRef<UploadedFile[]>([]);
  const { user } = useAuth();

  useEffect(() => { if (!user) { setFiles([]); setLoading(false); return; } setLoading(true); void fetchNoteFiles(user.id).then((storedFiles) => { previousFiles.current = storedFiles; setFiles(storedFiles); }).catch(console.error).finally(() => setLoading(false)); }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    const removedIds = previousFiles.current.filter((file) => !files.some((current) => current.id === file.id)).map((file) => file.id);
    const retainedFiles = files.filter((file) => previousFiles.current.some((previous) => previous.id === file.id));
    previousFiles.current = files;
    void Promise.all([deleteNoteFiles(user.id, removedIds), ...retainedFiles.map((file) => updateNoteFile(user.id, file))]).catch(console.error);
  }, [files, loading, user]);

  const uploadFiles = useCallback(async (noteId: string, fileList: FileList | File[]) => {
    const succeeded: UploadedFile[] = [];
    const rejected: string[] = [];
    const inlineFallbackFiles: File[] = [];
    
    for (const file of Array.from(fileList)) {
      if (isFileTooLarge(file)) { 
        console.warn('File too large for upload.', { fileName: file.name, fileSize: file.size });
        rejected.push(`${file.name} (too large — 4MB limit per file)`); 
        continue; 
      }
      try {
        const extension = getExtension(file.name);
        const record: Omit<UploadedFile, 'dataURL'> = { id: generateId(), noteId, name: file.name, size: file.size, type: file.type || 'application/octet-stream', extension, uploadedAt: new Date().toISOString(), category: categorizeFile(extension) };
        if (!user) throw new Error('No authenticated user.');
        
        console.info('Attempting storage upload for file.', { fileName: file.name, noteId });
        succeeded.push(await uploadNoteFile(user.id, noteId, file, record));
        console.info('Storage upload succeeded for file.', { fileName: file.name, fileId: record.id });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('Storage upload failed for file, attempting inline fallback.', { fileName: file.name, error: msg });
        
        // Inline base64 fallback for storage failures
        // Store the file object for inline processing instead of rejecting
        inlineFallbackFiles.push(file);
        
        // Also add to succeeded list with a special marker for inline processing
        // This allows the UI to show the file while using inline fallback
        const extension = getExtension(file.name);
        const inlineRecord: UploadedFile = { 
          id: generateId(), 
          noteId, 
          name: file.name, 
          size: file.size, 
          type: file.type || 'application/octet-stream', 
          extension, 
          uploadedAt: new Date().toISOString(), 
          dataURL: '', // Will be populated when needed
          category: categorizeFile(extension) 
        };
        // Mark as inline fallback by adding a special property
        (inlineRecord as any)._inlineFallback = true;
        (inlineRecord as any)._fileObject = file;
        succeeded.push(inlineRecord);
      }
    }
    
    if (succeeded.length) {
      setFiles((current) => [...current, ...succeeded]);
      console.info('Upload batch completed.', { 
        total: fileList.length, 
        storageUploads: succeeded.filter(f => !(f as any)._inlineFallback).length, 
        inlineFallbacks: succeeded.filter(f => (f as any)._inlineFallback).length,
        rejected: rejected.length 
      });
    }
    
    return { succeeded, rejected, inlineFallbackFiles };
  }, [user]);

  const deleteFile = useCallback((fileId: string) => setFiles((current) => current.filter((file) => file.id !== fileId)), []);
  const renameFile = useCallback((fileId: string, newName: string) => setFiles((current) => current.map((file) => file.id === fileId ? { ...file, name: newName } : file)), []);
  const getFilesForNote = useCallback((noteId: string) => files.filter((file) => file.noteId === noteId), [files]);
  return { files, setFiles, loading, uploadFiles, deleteFile, renameFile, getFilesForNote };
}
