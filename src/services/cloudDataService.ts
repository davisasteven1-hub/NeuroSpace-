import { TABLES } from '../constants/database';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type { Exam } from '../types';
import type { GPAData } from '../types/gpa';
import type { AssignmentRecord } from '../types/assignment';
import type { TimetableCourse } from '../types/timetable';

type SnapshotTable =
  | typeof TABLES.USER_TIMETABLE
  | typeof TABLES.USER_EXAMS
  | typeof TABLES.USER_GPA
  | typeof TABLES.USER_ASSIGNMENTS;

interface SnapshotValues {
  [TABLES.USER_TIMETABLE]: TimetableCourse[];
  [TABLES.USER_EXAMS]: Exam[];
  [TABLES.USER_GPA]: GPAData;
  [TABLES.USER_ASSIGNMENTS]: AssignmentRecord[];
}

type SnapshotColumn<Table extends SnapshotTable> =
  Table extends typeof TABLES.USER_TIMETABLE ? 'courses'
    : Table extends typeof TABLES.USER_EXAMS ? 'exams'
      : Table extends typeof TABLES.USER_GPA ? 'data'
        : 'assignments';

type SnapshotValue<Table extends SnapshotTable> = SnapshotValues[Table];
type SnapshotInsert<Table extends SnapshotTable> = Database['public']['Tables'][Table]['Insert'];

export async function fetchSnapshot<Table extends SnapshotTable>(
  table: Table,
  column: SnapshotColumn<Table>,
  userId: string,
): Promise<SnapshotValue<Table> | null> {
  if (table === TABLES.USER_TIMETABLE) {
    const { data, error } = await supabase.from(TABLES.USER_TIMETABLE).select('courses').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return (data?.courses ?? null) as SnapshotValue<Table> | null;
  }

  if (table === TABLES.USER_EXAMS) {
    const { data, error } = await supabase.from(TABLES.USER_EXAMS).select('exams').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return (data?.exams ?? null) as SnapshotValue<Table> | null;
  }

  if (table === TABLES.USER_ASSIGNMENTS) {
    const { data, error } = await supabase.from(TABLES.USER_ASSIGNMENTS).select('assignments').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return (data?.assignments ?? null) as SnapshotValue<Table> | null;
  }

  const { data, error } = await supabase.from(TABLES.USER_GPA).select('data').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return (data?.data ?? null) as SnapshotValue<Table> | null;
}

export async function saveSnapshot<Table extends SnapshotTable>(
  table: Table,
  column: SnapshotColumn<Table>,
  userId: string,
  value: SnapshotValue<Table>,
): Promise<void> {
  const updatedAt = new Date().toISOString();

  if (table === TABLES.USER_TIMETABLE) {
    const payload: SnapshotInsert<typeof TABLES.USER_TIMETABLE> = { user_id: userId, courses: value as TimetableCourse[], updated_at: updatedAt };
    const { error } = await supabase.from(TABLES.USER_TIMETABLE).upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    return;
  }

  if (table === TABLES.USER_EXAMS) {
    const payload: SnapshotInsert<typeof TABLES.USER_EXAMS> = { user_id: userId, exams: value as Exam[], updated_at: updatedAt };
    const { error } = await supabase.from(TABLES.USER_EXAMS).upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    return;
  }

  if (table === TABLES.USER_ASSIGNMENTS) {
    const payload: SnapshotInsert<typeof TABLES.USER_ASSIGNMENTS> = { user_id: userId, assignments: value as AssignmentRecord[], updated_at: updatedAt };
    const { error } = await supabase.from(TABLES.USER_ASSIGNMENTS).upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    return;
  }

  const payload: SnapshotInsert<typeof TABLES.USER_GPA> = { user_id: userId, data: value as GPAData, updated_at: updatedAt };
  const { error } = await supabase.from(TABLES.USER_GPA).upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}

export async function loadSnapshotOrCreate<Table extends SnapshotTable>(
  table: Table,
  column: SnapshotColumn<Table>,
  userId: string,
  initialValue: SnapshotValue<Table>,
): Promise<SnapshotValue<Table>> {
  const snapshot = await fetchSnapshot(table, column, userId);
  if (snapshot !== null) return snapshot;
  await saveSnapshot(table, column, userId, initialValue);
  return initialValue;
}
