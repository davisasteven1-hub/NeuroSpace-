import { fetchSnapshot, saveSnapshot } from './cloudDataService';
import { saveNotes } from './notesService';
import { TABLES } from '../constants/database';
import type { AIImportPreview, AIImportTarget } from '../types/aiImport';
import type { TimetableCourse } from '../types/timetable';
import type { Exam } from '../types';
import type { AssignmentRecord, AssignmentPriority } from '../types/assignment';
import type { GPAData, Grade, Semester } from '../types/gpa';
import type { Note, NoteColor } from '../types/notes';
import { generateId, readFileAsDataURL } from '../utils/notesUtils';

const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
const IMPORT_ENDPOINT = '/api/import';
const TARGETS = ['timetable', 'exams', 'assignments', 'gpa', 'notes'] as const;

type ImportTarget = typeof TARGETS[number];

function isTarget(value: string): value is ImportTarget {
  return (TARGETS as readonly string[]).includes(value);
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function number(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toTime(value: unknown): string {
  const input = text(value);
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(input) ? input : '';
}

function toDate(value: unknown): string {
  const input = text(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(input) ? input : '';
}

function toTimetableDay(value: unknown): string {
  const input = text(value).toLowerCase().replace(/\./g, '');
  const days: Record<string, string> = {
    mon: 'Monday', monday: 'Monday',
    tue: 'Tuesday', tues: 'Tuesday', tuesday: 'Tuesday',
    wed: 'Wednesday', wednesday: 'Wednesday',
    thu: 'Thursday', thur: 'Thursday', thurs: 'Thursday', thursday: 'Thursday',
    fri: 'Friday', friday: 'Friday',
    sat: 'Saturday', saturday: 'Saturday',
  };
  return days[input] ?? '';
}

function parsePreview(value: unknown): AIImportPreview {
  const input = record(value);
  const target = text(input?.target);
  if (!isTarget(target)) throw new Error('The AI could not identify a supported destination for this document.');
  return {
    target,
    summary: text(input?.summary, 'Review the extracted entries before applying them.'),
    warnings: Array.isArray(input?.warnings) ? input.warnings.filter((warning): warning is string => typeof warning === 'string') : [],
    items: Array.isArray(input?.items) ? input.items : [],
  };
}

export async function analyseAIImport(accessToken: string, file: File, target: AIImportTarget, instruction: string): Promise<AIImportPreview> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('Import files must be 4 MB or smaller.');
  const supported = file.type === 'application/pdf' || file.type.startsWith('image/') || file.type === 'text/plain' || file.type === 'text/csv';
  if (!supported) throw new Error('Upload a PDF, image, text file, or CSV file for AI import.');

  const dataUrl = await readFileAsDataURL(file);
  const response = await fetch(IMPORT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ target, fileName: file.name, mimeType: file.type || 'application/octet-stream', data: dataUrl.split(',')[1], instruction: instruction.trim().slice(0, 1000) }),
  });
  const payload = await response.json().catch(() => ({})) as { preview?: unknown; error?: string };
  if (!response.ok || !payload.preview) throw new Error(payload.error ?? 'Unable to analyse this document.');
  return parsePreview(payload.preview);
}

function timetableItems(items: unknown[]): TimetableCourse[] {
  return items.flatMap((item, index) => {
    const input = record(item);
    const code = text(input?.code).toUpperCase();
    const title = text(input?.title);
    const day = toTimetableDay(input?.day);
    const start = toTime(input?.start);
    const end = toTime(input?.end);
    if (!code || !title || !day || !start || !end || start >= end) return [];
    const type = text(input?.type).toLowerCase();
    return [{
      id: Date.now() + index,
      code,
      title,
      units: Math.min(6, Math.max(1, Math.round(number(input?.units, 1)))),
      type: type === 'gst' || type === 'lab' ? type : 'core',
      lecturer: text(input?.lecturer),
      venue: text(input?.venue),
      day,
      start,
      end,
    }];
  });
}

function examItems(items: unknown[]): Exam[] {
  return items.flatMap((item) => {
    const input = record(item);
    const course_code = text(input?.course_code).toUpperCase();
    const course_name = text(input?.course_name);
    const date = toDate(input?.date);
    const time = toTime(input?.time);
    if (!course_code || !course_name || !date || !time) return [];
    const urgency = text(input?.urgency).toUpperCase();
    return [{
      course_code,
      course_name,
      date,
      time,
      duration: text(input?.duration, '2 hours'),
      urgency: ['EXTREME', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'].includes(urgency) ? urgency as Exam['urgency'] : 'MODERATE',
      venue: text(input?.venue),
      instructor: text(input?.instructor) || undefined,
      notes: text(input?.notes) || undefined,
      reminder: text(input?.reminder) || undefined,
      colorLabel: 'cyan',
      createdAt: new Date().toISOString(),
      completed: false,
    }];
  });
}

function assignmentItems(items: unknown[]): AssignmentRecord[] {
  return items.flatMap((item, index) => {
    const input = record(item);
    const title = text(input?.title);
    const dueDate = toDate(input?.dueDate);
    if (!title || !dueDate) return [];
    const priority = text(input?.priority).toUpperCase();
    return [{
      id: Date.now() + index,
      title,
      courseCode: text(input?.courseCode).toUpperCase(),
      courseName: text(input?.courseName),
      dueDate,
      dueTime: toTime(input?.dueTime),
      priority: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(priority) ? priority as AssignmentPriority : 'MODERATE',
      venue: text(input?.venue) || undefined,
      instructor: text(input?.instructor) || undefined,
      notes: text(input?.notes) || undefined,
      reminder: text(input?.reminder) || undefined,
      completed: false,
    }];
  });
}

function gpaItems(items: unknown[]): Semester[] {
  return items.flatMap((item) => {
    const input = record(item);
    const level = text(input?.level);
    const term = text(input?.term);
    const courses = Array.isArray(input?.courses) ? input.courses.flatMap((course) => {
      const value = record(course);
      const code = text(value?.code).toUpperCase();
      const title = text(value?.title);
      const grade = text(value?.grade).toUpperCase();
      if (!code || !title || !['A', 'B', 'C', 'D', 'E', 'F'].includes(grade)) return [];
      return [{ id: generateId(), code, title, units: Math.max(1, Math.round(number(value?.units, 1))), grade: grade as Grade, remarks: text(value?.remarks) || undefined }];
    }) : [];
    return level && term && courses.length ? [{ id: generateId(), level, term, courses }] : [];
  });
}

function noteItems(items: unknown[]): Note[] {
  const now = new Date().toISOString();
  return items.flatMap((item) => {
    const input = record(item);
    const title = text(input?.title);
    const content = text(input?.content);
    if (!title || !content) return [];
    return [{
      id: generateId(), title, content: `<p>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '</p><p>')}</p>`, folderId: null,
      tags: Array.isArray(input?.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 8) : [],
      color: 'gray' as NoteColor, favorite: false, pinned: false, trashed: false, createdAt: now, updatedAt: now, attachmentIds: [],
    }];
  });
}

export async function applyAIImport(userId: string, preview: AIImportPreview): Promise<number> {
  if (preview.target === 'timetable') {
    const additions = timetableItems(preview.items);
    const current = await fetchSnapshot(TABLES.USER_TIMETABLE, 'courses', userId) ?? [];
    await saveSnapshot(TABLES.USER_TIMETABLE, 'courses', userId, [...current, ...additions]);
    return additions.length;
  }
  if (preview.target === 'exams') {
    const additions = examItems(preview.items);
    const current = await fetchSnapshot(TABLES.USER_EXAMS, 'exams', userId) ?? [];
    await saveSnapshot(TABLES.USER_EXAMS, 'exams', userId, [...current, ...additions]);
    return additions.length;
  }
  if (preview.target === 'assignments') {
    const additions = assignmentItems(preview.items);
    const current = await fetchSnapshot(TABLES.USER_ASSIGNMENTS, 'assignments', userId) ?? [];
    await saveSnapshot(TABLES.USER_ASSIGNMENTS, 'assignments', userId, [...current, ...additions]);
    return additions.length;
  }
  if (preview.target === 'gpa') {
    const additions = gpaItems(preview.items);
    const current = await fetchSnapshot(TABLES.USER_GPA, 'data', userId) ?? { semesters: [], predictedCourses: [], creditsRequired: 120 } as GPAData;
    await saveSnapshot(TABLES.USER_GPA, 'data', userId, { ...current, semesters: [...current.semesters, ...additions] });
    return additions.length;
  }
  const additions = noteItems(preview.items);
  await saveNotes(userId, additions);
  return additions.length;
}
