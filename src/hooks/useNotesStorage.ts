import { useEffect, useRef, useState } from 'react';
import type { Folder, Note } from '../types/notes';
import { DEFAULT_FOLDERS } from '../constants/notesConstants';
import { generateId } from '../utils/notesUtils';
import { deleteFolders, deleteNotes, fetchFolders, fetchNotes, saveFolders, saveNotes } from '../services/notesService';
import { useAuth } from '../context/AuthContext';

interface UseNotesStorageResult { notes: Note[]; setNotes: React.Dispatch<React.SetStateAction<Note[]>>; folders: Folder[]; setFolders: React.Dispatch<React.SetStateAction<Folder[]>>; loading: boolean; }

const buildDefaultFolders = (): Folder[] => DEFAULT_FOLDERS.map((name) => ({ id: generateId(), name, createdAt: new Date().toISOString() }));

export function useNotesStorage(): UseNotesStorageResult {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const previousNotes = useRef<Note[]>([]);
  const previousFolders = useRef<Folder[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setNotes([]); setFolders([]); setLoading(false); return; }
    setLoading(true);
    void Promise.all([fetchNotes(user.id), fetchFolders(user.id)]).then(([storedNotes, storedFolders]) => {
      const initialFolders = storedFolders.length ? storedFolders : buildDefaultFolders();
      previousNotes.current = storedNotes;
      previousFolders.current = storedFolders;
      setNotes(storedNotes);
      setFolders(initialFolders);
    }).catch(console.error).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (loading || !user) return;
    const removedIds = previousNotes.current.filter((note) => !notes.some((current) => current.id === note.id)).map((note) => note.id);
    previousNotes.current = notes;
    void saveNotes(user.id, notes).then(() => deleteNotes(user.id, removedIds)).catch(console.error);
  }, [notes, loading, user]);

  useEffect(() => {
    if (loading || !user) return;
    const removedIds = previousFolders.current.filter((folder) => !folders.some((current) => current.id === folder.id)).map((folder) => folder.id);
    previousFolders.current = folders;
    void saveFolders(user.id, folders).then(() => deleteFolders(user.id, removedIds)).catch(console.error);
  }, [folders, loading, user]);

  return { notes, setNotes, folders, setFolders, loading };
}
