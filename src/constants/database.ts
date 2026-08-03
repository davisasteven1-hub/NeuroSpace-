export const TABLES = {
  PROFILES: 'profiles',
  ADMIN_USERS: 'admin_users',
  USER_TIMETABLE: 'user_timetable',
  USER_EXAMS: 'user_exams',
  USER_GPA: 'user_gpa',
  USER_ASSIGNMENTS: 'user_assignments',
  NOTES: 'notes',
  NOTE_FOLDERS: 'note_folders',
  NOTE_FILES: 'note_files',
  AI_CHATS: 'ai_chats',
  AI_MESSAGES: 'ai_messages',
} as const;

export const LEGACY_STORAGE_KEYS = {
  TIMETABLE: 'neurospace_timetable',
  GPA: 'neurospace_gpa',
  EXAMS: 'exams',
  NOTES: 'neurospace-notes',
  FOLDERS: 'neurospace-folders',
  FILES: 'neurospace-files',
  PROFILE_PICTURE: 'neurospace_profile_picture',
} as const;

export const UI_PREFERENCE_KEYS = {
  SLEEP_SCHEDULE: 'sleep-schedule',
  POMODORO_SETTINGS: 'pomodoro-settings',
  TRIAGE_MODE: 'triage-mode',
  SLEEP_MODE: 'sleep-mode',
  EXAM_NOTIFICATION_FLAGS: 'exam-notification-flags',
} as const;

export const MIGRATION_FLAG_KEY = 'neurospace_migrated_to_supabase';

export const SAVE_DEBOUNCE_MS = 500;
