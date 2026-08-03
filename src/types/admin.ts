import type { AssignmentRecord } from './assignment';
import type { AIChat, AIMessage } from './ai';
import type { Profile } from './auth';
import type { Exam } from './index';
import type { GPAData } from './gpa';
import type { Note } from './notes';
import type { TimetableCourse } from './timetable';

export type VerificationFilter = 'all' | 'verified' | 'unverified';

export interface AdminUserRecord {
  id: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  currentGpa: number | null;
}

export interface AdminOverview {
  totalUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  activeUsers: number;
  activeWindowDays: number;
  academicTotals: {
    userGpa: number;
    userTimetable: number;
    userExams: number;
    userAssignments: number;
    notes: number;
    noteFiles: number;
    aiChats: number;
    aiMessages: number;
  };
}

export interface AdminUsersResponse {
  overview: AdminOverview;
  users: AdminUserRecord[];
  filters: {
    search: string;
    verification: VerificationFilter;
    gpaMin: number | null;
    gpaMax: number | null;
    page: number;
    pageSize: number;
  };
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface AdminUserAcademicSummary {
  conversations: number;
  lastInteractionAt: string | null;
  totalMessages: number;
}

export interface AdminUserDetail {
  auth: {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: string;
    lastSignInAt: string | null;
  };
  profile: Profile | null;
  avatarUrl: string | null;
  gpa: GPAData | null;
  timetable: TimetableCourse[];
  exams: Exam[];
  assignments: AssignmentRecord[];
  notes: Note[];
  noteFiles: Array<{
    id: string;
    noteId: string;
    noteTitle: string | null;
    name: string;
    size: number;
    type: string;
    extension: string;
    uploadedAt: string;
    category: string;
  }>;
  ai: AdminUserAcademicSummary & {
    conversationsList: AIChat[];
    recentMessages: AIMessage[];
  };
}

export interface AdminApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
