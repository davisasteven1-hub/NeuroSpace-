import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimetableCourse } from '../types/timetable';
import { SEED_TIMETABLE_COURSES } from '../types/timetable';
import { TABLES } from '../constants/database';
import { fetchSnapshot, saveSnapshot } from '../services/cloudDataService';
import { useAuth } from '../context/AuthContext';
import { broadcastStorageSync, subscribeStorageSync } from '../utils/storageSync';

export type Course = TimetableCourse;
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const normalizeImportedDay = (day: string): string => {
  const names: Record<string, string> = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
  };
  return names[day.trim().toLowerCase().replace(/\./g, '')] ?? day;
};
export function useTimetableStorage(): [Course[], React.Dispatch<React.SetStateAction<Course[]>>, boolean] {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const skipSaveRef = useRef(false);

  const syncedSetCourses = useCallback<React.Dispatch<React.SetStateAction<Course[]>>>((updater) => {
    setCourses((current) => {
      const next = typeof updater === 'function'
        ? (updater as (value: Course[]) => Course[])(current)
        : updater;

      if (user) {
        broadcastStorageSync('timetable', user.id, next);
      }

      return next;
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      setCourses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    void fetchSnapshot(TABLES.USER_TIMETABLE, 'courses', user.id)
      .then((value) => {
        const source = value ?? SEED_TIMETABLE_COURSES.map((course) => ({ ...course }));
        setCourses(source.map((course) => ({ ...course, day: normalizeImportedDay(course.day) })));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    return subscribeStorageSync('timetable', user.id, (next) => {
      skipSaveRef.current = true;
      setCourses(next.map((course) => ({ ...course, day: normalizeImportedDay(course.day) })));
    });
  }, [user]);

  useEffect(() => {
    if (skipSaveRef.current) {
      skipSaveRef.current = false;
      return;
    }

    if (!loading && user) {
      void saveSnapshot(TABLES.USER_TIMETABLE, 'courses', user.id, courses).catch(console.error);
    }
  }, [courses, loading, user]);

  return [courses, syncedSetCourses, loading];
}
