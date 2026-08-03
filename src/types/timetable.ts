export type TimetableCourse = {
  id: number;
  code: string;
  title: string;
  units: number;
  type: 'core' | 'gst' | 'lab';
  lecturer: string;
  venue: string;
  day: string;
  start: string;
  end: string;
};

export const TIMETABLE_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const SEED_TIMETABLE_COURSES: TimetableCourse[] = [
  {
    id: 1,
    code: 'CSC201',
    title: 'Computer Programming II',
    units: 3,
    type: 'core',
    lecturer: 'Dr. Musa',
    venue: 'Lab A',
    day: 'Monday',
    start: '08:00',
    end: '10:00',
  },
  {
    id: 2,
    code: 'GST201',
    title: 'Entrepreneurship',
    units: 1,
    type: 'gst',
    lecturer: 'Dr. Bello',
    venue: 'LT3',
    day: 'Monday',
    start: '12:00',
    end: '13:00',
  },
  {
    id: 3,
    code: 'CSC203',
    title: 'Programming Lab',
    units: 2,
    type: 'lab',
    lecturer: 'Dr. Ibrahim',
    venue: 'Lab 2',
    day: 'Wednesday',
    start: '14:00',
    end: '17:00',
  },
];
