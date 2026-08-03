import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAssignments, saveAssignments } from '../services/assignmentService';
import type { AssignmentRecord } from '../types/assignment';
import { useAuth } from '../context/AuthContext';
import { broadcastStorageSync, subscribeStorageSync } from '../utils/storageSync';

export function useAssignmentStorage(): [AssignmentRecord[], React.Dispatch<React.SetStateAction<AssignmentRecord[]>>, boolean] {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const skipSaveRef = useRef(false);

  const syncedSetAssignments = useCallback<React.Dispatch<React.SetStateAction<AssignmentRecord[]>>>((updater) => {
    setAssignments((current) => {
      const next = typeof updater === 'function'
        ? (updater as (value: AssignmentRecord[]) => AssignmentRecord[])(current)
        : updater;

      if (user) {
        broadcastStorageSync('assignments', user.id, next);
      }

      return next;
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setAssignments([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    void fetchAssignments(user.id)
      .then((storedAssignments) => setAssignments(storedAssignments ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeStorageSync('assignments', user.id, (next) => {
      skipSaveRef.current = true;
      setAssignments(next);
    });
  }, [user]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    if (!loading && user) {
      void saveAssignments(user.id, assignments).catch(console.error);
    }
  }, [assignments, loading, user]);

  return [assignments, syncedSetAssignments, loading];
}
