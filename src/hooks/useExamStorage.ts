import { useCallback, useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Exam } from '../types';
import { TABLES } from '../constants/database';
import { fetchSnapshot, saveSnapshot } from '../services/cloudDataService';
import { useAuth } from '../context/AuthContext';
import { broadcastStorageSync, subscribeStorageSync } from '../utils/storageSync';

type ExamSetter = Dispatch<SetStateAction<Exam[]>>;
type CommitExams = (updater: SetStateAction<Exam[]>) => Promise<void>;

export function useExamStorage(): [Exam[], ExamSetter, boolean, string | null, CommitExams] {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const examsRef = useRef<Exam[]>([]);
  const writeQueue = useRef(Promise.resolve());
  const { user } = useAuth();

  const syncedSetExams = useCallback<ExamSetter>((updater) => {
    setExams((current) => {
      const next = typeof updater === 'function'
        ? (updater as (value: Exam[]) => Exam[])(current)
        : updater;

      examsRef.current = next;

      if (user) {
        broadcastStorageSync('exams', user.id, next);
      }

      return next;
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      examsRef.current = [];
      setExams([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    void fetchSnapshot(TABLES.USER_EXAMS, 'exams', user.id)
      .then((value) => {
        const next = Array.isArray(value) ? value : [];
        examsRef.current = next;
        setExams(next);
      })
      .catch(() => setError('Unable to load exams. Check your connection and try again.'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeStorageSync('exams', user.id, (next) => {
      examsRef.current = next;
      setExams(next);
      setError(null);
    });
  }, [user]);

  const commitExams = useCallback<CommitExams>(async (updater) => {
    if (!user) throw new Error('Your session has expired. Please sign in again.');

    const next = typeof updater === 'function'
      ? (updater as (current: Exam[]) => Exam[])(examsRef.current)
      : updater;

    examsRef.current = next;
    setExams(next);
    setError(null);
    broadcastStorageSync('exams', user.id, next);

    writeQueue.current = writeQueue.current
      .catch(() => undefined)
      .then(() => saveSnapshot(TABLES.USER_EXAMS, 'exams', user.id, next));

    try {
      await writeQueue.current;
    } catch {
      setError('Unable to save exams. Your latest change could not be synced.');
      throw new Error('Unable to save exams.');
    }
  }, [user]);

  return [exams, syncedSetExams, loading, error, commitExams];
}
