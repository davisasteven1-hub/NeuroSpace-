export type AIImportTarget = 'auto' | 'timetable' | 'exams' | 'assignments' | 'gpa' | 'notes';

export interface AIImportPreview {
  target: Exclude<AIImportTarget, 'auto'>;
  summary: string;
  warnings: string[];
  items: unknown[];
}
