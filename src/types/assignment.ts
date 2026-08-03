export type AssignmentPriority = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export type AssignmentRecord = {
  id: number;
  courseCode: string;
  courseName: string;
  title: string;
  dueDate: string;
  dueTime: string;
  venue?: string;
  instructor?: string;
  notes?: string;
  reminder?: string;
  colorLabel?: 'blue' | 'purple' | 'green' | 'yellow' | 'pink' | 'orange' | 'cyan';
  priority: AssignmentPriority;
  completed?: boolean;
};

export function isAssignmentRecord(value: unknown): value is AssignmentRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'number' && typeof record.title === 'string' && typeof record.dueDate === 'string';
}

export function normalizeAssignments(raw: unknown): AssignmentRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isAssignmentRecord);
}
