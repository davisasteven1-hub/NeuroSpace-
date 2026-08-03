import type { Exam } from '../types';
import type { AssignmentRecord } from '../types/assignment';
import type { TimetableCourse } from '../types/timetable';
import { getExamEndDate, parseExamDate } from './index';

export type NotificationFilter = 'all' | 'urgent' | 'exams' | 'assignments' | 'classes';
export type NotificationSource = 'exam' | 'assignment' | 'class' | 'system';
export type NotificationSeverity = 'critical' | 'urgent' | 'warning' | 'upcoming' | 'class' | 'success';
export type NotificationTone = 'red' | 'orange' | 'yellow' | 'blue' | 'purple' | 'green';
export type BadgeTone = 'red' | 'orange' | 'blue';

export type SmartNotification = {
  id: string;
  source: NotificationSource;
  severity: NotificationSeverity;
  tone: NotificationTone;
  urgencyRank: number;
  isUrgent: boolean;
  title: string;
  headline: string;
  body: string;
  helperText?: string;
  sourceLabel: string;
  courseCode?: string;
  dueAt?: string;
  route?: string;
  routeState?: Record<string, unknown>;
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

const timeToDate = (time: string, base: Date): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const next = new Date(base);
  next.setHours(hours || 0, minutes || 0, 0, 0);
  return next;
};

const parseAssignmentDate = (assignment: AssignmentRecord): Date => {
  const [year, month, day] = assignment.dueDate.split('-').map(Number);
  const [hours, minutes] = (assignment.dueTime || '23:59').split(':').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0);
};

const isSameCalendarDay = (left: Date, right: Date): boolean =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

const isTomorrow = (target: Date, base: Date): boolean => {
  const tomorrow = new Date(base);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameCalendarDay(target, tomorrow);
};

const weekdayLabel = (date: Date): string =>
  date.toLocaleDateString(undefined, { weekday: 'long' });

const shortDateTime = (date: Date): string =>
  date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const formatClockTime = (date: Date): string =>
  date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });

export const formatTimeRemaining = (targetDate: Date, now: Date): string => {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return 'now';
  }

  const totalMinutes = Math.round(diffMs / MINUTE);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}${hours > 0 ? ` ${hours} hr` : ''}`;
  }

  if (hours > 0) {
    return `${hours} hr${hours === 1 ? '' : 's'}${minutes > 0 ? ` ${minutes} min` : ''}`;
  }

  return `${Math.max(1, minutes)} min`;
};

export const calculateUrgency = (notification: SmartNotification): number => notification.urgencyRank;

const buildExamNotification = (exam: Exam, now: Date): SmartNotification | null => {
  if (exam.completed) {
    return null;
  }

  const start = parseExamDate(exam.date, exam.time);
  const end = getExamEndDate(exam);
  if (end <= now) {
    return null;
  }

  const diff = start.getTime() - now.getTime();
  const idBase = `exam:${exam.course_code}:${exam.date}:${exam.time}`;

  if (diff <= 0) {
    return {
      id: `${idBase}:live`,
      source: 'exam',
      severity: 'urgent',
      tone: 'orange',
      urgencyRank: 1,
      isUrgent: true,
      title: 'EXAM IN PROGRESS',
      headline: exam.course_name,
      body: `Now • ${formatClockTime(start)} • ${exam.venue || 'Venue pending'}`,
      helperText: `Ends in ${formatTimeRemaining(end, now)}.`,
      sourceLabel: 'Exam',
      courseCode: exam.course_code,
      dueAt: start.toISOString(),
      route: '/exams',
    };
  }

  if (isSameCalendarDay(start, now)) {
    return {
      id: `${idBase}:today`,
      source: 'exam',
      severity: 'urgent',
      tone: 'orange',
      urgencyRank: 1,
      isUrgent: true,
      title: 'EXAM TODAY',
      headline: exam.course_name,
      body: `Today • ${formatClockTime(start)} • ${exam.venue || 'Venue pending'}`,
      helperText: `${formatTimeRemaining(start, now)} remaining.`,
      sourceLabel: 'Exam',
      courseCode: exam.course_code,
      dueAt: start.toISOString(),
      route: '/exams',
    };
  }

  if (diff <= DAY) {
    return {
      id: `${idBase}:tomorrow`,
      source: 'exam',
      severity: 'urgent',
      tone: 'orange',
      urgencyRank: 1,
      isUrgent: true,
      title: 'EXAM TOMORROW',
      headline: exam.course_name,
      body: `Tomorrow • ${formatClockTime(start)} • ${exam.venue || 'Venue pending'}`,
      helperText: `Only ${formatTimeRemaining(start, now)} remaining.`,
      sourceLabel: 'Exam',
      courseCode: exam.course_code,
      dueAt: start.toISOString(),
      route: '/exams',
    };
  }

  if (diff <= 3 * DAY) {
    return {
      id: `${idBase}:three-days`,
      source: 'exam',
      severity: 'warning',
      tone: 'yellow',
      urgencyRank: 2,
      isUrgent: false,
      title: 'EXAM APPROACHING',
      headline: exam.course_name,
      body: `${weekdayLabel(start)} • ${formatClockTime(start)} • ${exam.venue || 'Venue pending'}`,
      helperText: `Starts in ${formatTimeRemaining(start, now)}.`,
      sourceLabel: 'Exam',
      courseCode: exam.course_code,
      dueAt: start.toISOString(),
      route: '/exams',
    };
  }

  if (diff <= 7 * DAY) {
    return {
      id: `${idBase}:seven-days`,
      source: 'exam',
      severity: 'upcoming',
      tone: 'blue',
      urgencyRank: 4,
      isUrgent: false,
      title: 'UPCOMING EXAM',
      headline: exam.course_name,
      body: `${weekdayLabel(start)} • ${formatClockTime(start)} • ${exam.venue || 'Venue pending'}`,
      helperText: shortDateTime(start),
      sourceLabel: 'Exam',
      courseCode: exam.course_code,
      dueAt: start.toISOString(),
      route: '/exams',
    };
  }

  return null;
};

const buildAssignmentNotification = (assignment: AssignmentRecord, now: Date): SmartNotification | null => {
  if (assignment.completed) {
    return null;
  }

  const dueDate = parseAssignmentDate(assignment);
  const diff = dueDate.getTime() - now.getTime();
  const idBase = `assignment:${assignment.id}:${assignment.dueDate}:${assignment.dueTime || '23:59'}`;

  if (diff < 0) {
    const daysLate = Math.max(1, Math.ceil(Math.abs(diff) / DAY));
    const wasDueLabel = daysLate === 1
      ? `Was due yesterday at ${formatClockTime(dueDate)}`
      : `Was due ${shortDateTime(dueDate)}`;

    return {
      id: `${idBase}:overdue`,
      source: 'assignment',
      severity: 'critical',
      tone: 'red',
      urgencyRank: 0,
      isUrgent: true,
      title: 'OVERDUE ASSIGNMENT',
      headline: assignment.title,
      body: wasDueLabel,
      helperText: 'Submit immediately to avoid losing marks.',
      sourceLabel: 'Assignment',
      courseCode: assignment.courseCode,
      dueAt: dueDate.toISOString(),
      route: '/assignments',
      routeState: { highlightAssignmentId: assignment.id },
    };
  }

  if (isSameCalendarDay(dueDate, now)) {
    return {
      id: `${idBase}:today`,
      source: 'assignment',
      severity: 'urgent',
      tone: 'orange',
      urgencyRank: 1,
      isUrgent: true,
      title: 'ASSIGNMENT DUE TODAY',
      headline: assignment.title,
      body: `Due today • ${formatClockTime(dueDate)}`,
      helperText: `${formatTimeRemaining(dueDate, now)} remaining.`,
      sourceLabel: 'Assignment',
      courseCode: assignment.courseCode,
      dueAt: dueDate.toISOString(),
      route: '/assignments',
      routeState: { highlightAssignmentId: assignment.id },
    };
  }

  if (isTomorrow(dueDate, now)) {
    return {
      id: `${idBase}:tomorrow`,
      source: 'assignment',
      severity: 'urgent',
      tone: 'orange',
      urgencyRank: 1,
      isUrgent: true,
      title: 'ASSIGNMENT DUE TOMORROW',
      headline: assignment.title,
      body: `Tomorrow • ${formatClockTime(dueDate)}`,
      helperText: `Only ${formatTimeRemaining(dueDate, now)} remaining.`,
      sourceLabel: 'Assignment',
      courseCode: assignment.courseCode,
      dueAt: dueDate.toISOString(),
      route: '/assignments',
      routeState: { highlightAssignmentId: assignment.id },
    };
  }

  if (diff <= 3 * DAY) {
    return {
      id: `${idBase}:three-days`,
      source: 'assignment',
      severity: 'warning',
      tone: 'yellow',
      urgencyRank: 2,
      isUrgent: false,
      title: 'ASSIGNMENT DUE SOON',
      headline: assignment.title,
      body: `Due in ${formatTimeRemaining(dueDate, now)} • ${weekdayLabel(dueDate)} ${formatClockTime(dueDate)}`,
      helperText: assignment.courseName,
      sourceLabel: 'Assignment',
      courseCode: assignment.courseCode,
      dueAt: dueDate.toISOString(),
      route: '/assignments',
      routeState: { highlightAssignmentId: assignment.id },
    };
  }

  if (diff <= 7 * DAY) {
    return {
      id: `${idBase}:seven-days`,
      source: 'assignment',
      severity: 'upcoming',
      tone: 'blue',
      urgencyRank: 4,
      isUrgent: false,
      title: 'UPCOMING ASSIGNMENT',
      headline: assignment.title,
      body: `${weekdayLabel(dueDate)} • ${formatClockTime(dueDate)}`,
      helperText: assignment.courseName,
      sourceLabel: 'Assignment',
      courseCode: assignment.courseCode,
      dueAt: dueDate.toISOString(),
      route: '/assignments',
      routeState: { highlightAssignmentId: assignment.id },
    };
  }

  return null;
};

const buildClassNotifications = (courses: TimetableCourse[], now: Date): SmartNotification[] => {
  const today = now.toLocaleDateString('en-US', { weekday: 'long' });
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowName = tomorrow.toLocaleDateString('en-US', { weekday: 'long' });

  const todaysClasses = courses
    .filter((course) => course.day === today)
    .sort((left, right) => toMinutes(left.start) - toMinutes(right.start));

  const nextToday = todaysClasses.find((course) => timeToDate(course.start, now) > now) ?? null;

  const notifications: SmartNotification[] = [];

  if (nextToday) {
    const start = timeToDate(nextToday.start, now);
    const diff = start.getTime() - now.getTime();
    const bucket = diff <= 30 * MINUTE
      ? 'thirty'
      : diff <= HOUR
        ? 'sixty'
        : 'today';

    notifications.push({
      id: `class:${nextToday.id}:${today}:${bucket}`,
      source: 'class',
      severity: 'class',
      tone: 'purple',
      urgencyRank: bucket === 'today' ? 3 : 2,
      isUrgent: bucket !== 'today',
      title: bucket === 'thirty' ? 'CLASS STARTING SOON' : bucket === 'sixty' ? 'CLASS IN 1 HOUR' : 'NEXT CLASS TODAY',
      headline: nextToday.title,
      body: bucket === 'today'
        ? `${formatClockTime(start)} • ${nextToday.venue || 'Venue pending'}`
        : `Starts in ${formatTimeRemaining(start, now)} • ${nextToday.venue || 'Venue pending'}`,
      helperText: `${nextToday.code} • ${formatClockTime(start)} - ${nextToday.end}`,
      sourceLabel: 'Class',
      courseCode: nextToday.code,
      dueAt: start.toISOString(),
      route: '/timetable',
    });
  }

  const tomorrowMorning = courses
    .filter((course) => course.day === tomorrowName && toMinutes(course.start) < 12 * 60)
    .sort((left, right) => toMinutes(left.start) - toMinutes(right.start))[0] ?? null;

  if (tomorrowMorning) {
    const start = timeToDate(tomorrowMorning.start, tomorrow);
    notifications.push({
      id: `class:${tomorrowMorning.id}:${tomorrowName}:tomorrow`,
      source: 'class',
      severity: 'class',
      tone: 'purple',
      urgencyRank: 5,
      isUrgent: false,
      title: 'FIRST CLASS TOMORROW',
      headline: tomorrowMorning.title,
      body: `Tomorrow morning • ${formatClockTime(start)} • ${tomorrowMorning.venue || 'Venue pending'}`,
      helperText: `${tomorrowMorning.code} with ${tomorrowMorning.lecturer || 'Lecturer pending'}`,
      sourceLabel: 'Class',
      courseCode: tomorrowMorning.code,
      dueAt: start.toISOString(),
      route: '/timetable',
    });
  }

  return notifications;
};

const dedupeNotifications = (notifications: SmartNotification[]): SmartNotification[] => {
  const unique = new Map<string, SmartNotification>();

  notifications.forEach((notification) => {
    const existing = unique.get(notification.id);
    if (!existing || notification.urgencyRank < existing.urgencyRank) {
      unique.set(notification.id, notification);
    }
  });

  return Array.from(unique.values());
};

export const buildDeadlineNotifications = (
  exams: Exam[],
  assignments: AssignmentRecord[],
  courses: TimetableCourse[],
  now: Date,
): SmartNotification[] => {
  const examNotifications = exams
    .map((exam) => buildExamNotification(exam, now))
    .filter((notification): notification is SmartNotification => notification !== null);

  const assignmentNotifications = assignments
    .map((assignment) => buildAssignmentNotification(assignment, now))
    .filter((notification): notification is SmartNotification => notification !== null);

  const classNotifications = buildClassNotifications(courses, now);

  const hasUrgentAcademicDeadline = [...examNotifications, ...assignmentNotifications]
    .some((notification) => notification.urgencyRank <= 1);

  const allNotifications = dedupeNotifications([
    ...examNotifications,
    ...assignmentNotifications,
    ...classNotifications,
  ]);

  if (!hasUrgentAcademicDeadline) {
    allNotifications.push({
      id: 'system:all-clear:48h',
      source: 'system',
      severity: 'success',
      tone: 'green',
      urgencyRank: 7,
      isUrgent: false,
      title: 'ALL CLEAR',
      headline: 'No urgent academic issues',
      body: 'No urgent exams or assignments for the next 48 hours.',
      helperText: 'Stay focused and keep your schedule steady.',
      sourceLabel: 'System',
    });
  }

  return allNotifications.sort((left, right) => {
    if (left.urgencyRank !== right.urgencyRank) {
      return left.urgencyRank - right.urgencyRank;
    }

    if (left.dueAt && right.dueAt) {
      return new Date(left.dueAt).getTime() - new Date(right.dueAt).getTime();
    }

    if (left.dueAt) {
      return -1;
    }

    if (right.dueAt) {
      return 1;
    }

    return left.headline.localeCompare(right.headline);
  });
};

export const filterNotifications = (
  notifications: SmartNotification[],
  filter: NotificationFilter,
): SmartNotification[] => {
  switch (filter) {
    case 'urgent':
      return notifications.filter((notification) => notification.urgencyRank <= 2);
    case 'exams':
      return notifications.filter((notification) => notification.source === 'exam');
    case 'assignments':
      return notifications.filter((notification) => notification.source === 'assignment');
    case 'classes':
      return notifications.filter((notification) => notification.source === 'class');
    case 'all':
    default:
      return notifications;
  }
};

export const getBadgeTone = (notifications: SmartNotification[], unreadIds: Set<string>): BadgeTone => {
  const unread = notifications.filter((notification) => unreadIds.has(notification.id));
  if (unread.some((notification) => notification.isUrgent || notification.severity === 'critical')) {
    return 'red';
  }

  if (unread.some((notification) => notification.source === 'exam' || notification.source === 'assignment')) {
    return 'orange';
  }

  return 'blue';
};
