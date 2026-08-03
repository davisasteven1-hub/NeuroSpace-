import { supabase } from '../lib/supabase';
import { TABLES } from '../constants/database';
import { SEED_TIMETABLE_COURSES, TimetableCourse } from '../types/timetable';
import { logStorageError } from '../utils/errors';

export async function fetchTimetableCourses(userId: string): Promise<TimetableCourse[] | null> {
  const { data, error } = await supabase
    .from(TABLES.USER_TIMETABLE)
    .select('courses')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    logStorageError('timetableService.fetch', error);
    return null;
  }

  if (!data) return null;
  return Array.isArray(data.courses) ? (data.courses as TimetableCourse[]) : [];
}

export async function saveTimetableCourses(userId: string, courses: TimetableCourse[]): Promise<boolean> {
  const { error } = await supabase
    .from(TABLES.USER_TIMETABLE)
    .upsert(
      {
        user_id: userId,
        courses,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) {
    logStorageError('timetableService.save', error);
    return false;
  }

  return true;
}

export function getDefaultTimetableCourses(): TimetableCourse[] {
  return SEED_TIMETABLE_COURSES.map((course) => ({ ...course }));
}

export function subscribeToTimetableChanges(
  userId: string,
  onChange: (courses: TimetableCourse[]) => void
): () => void {
  const channel = supabase
    .channel(`timetable:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: TABLES.USER_TIMETABLE, filter: `user_id=eq.${userId}` },
      async () => {
        const courses = await fetchTimetableCourses(userId);
        if (courses) onChange(courses);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
