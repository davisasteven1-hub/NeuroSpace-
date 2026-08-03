import { TABLES } from '../constants/database';
import { loadSnapshotOrCreate } from './cloudDataService';

export async function initializeUserData(userId: string): Promise<void> {
  await Promise.all([
    loadSnapshotOrCreate(TABLES.USER_TIMETABLE, 'courses', userId, []),
    loadSnapshotOrCreate(TABLES.USER_EXAMS, 'exams', userId, []),
    loadSnapshotOrCreate(TABLES.USER_GPA, 'data', userId, { semesters: [], predictedCourses: [], creditsRequired: 120 }),
    loadSnapshotOrCreate(TABLES.USER_ASSIGNMENTS, 'assignments', userId, []),
  ]);
}
