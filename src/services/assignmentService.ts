import { TABLES } from '../constants/database';
import { fetchSnapshot, saveSnapshot } from './cloudDataService';
import type { AssignmentRecord } from '../types/assignment';
import { normalizeAssignments } from '../types/assignment';

export const fetchAssignments = async (userId: string): Promise<AssignmentRecord[] | null> => {
  const raw = await fetchSnapshot(TABLES.USER_ASSIGNMENTS, 'assignments', userId);
  if (raw === null) return null;
  return normalizeAssignments(raw);
};

export const saveAssignments = (userId: string, assignments: AssignmentRecord[]): Promise<void> =>
  saveSnapshot(TABLES.USER_ASSIGNMENTS, 'assignments', userId, assignments);
