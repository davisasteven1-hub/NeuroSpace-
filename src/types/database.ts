import type { Exam } from './index';
import type { GPAData } from './gpa';
import type { TimetableCourse } from './timetable';
import type { AssignmentRecord } from './assignment';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'student' | 'moderator' | 'owner';
          profile_picture_url: string | null;
          display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'student' | 'moderator' | 'owner';
          profile_picture_url?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'student' | 'moderator' | 'owner';
          profile_picture_url?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      admin_users: {
        Row: {
          user_id: string;
          created_at: string;
          added_by: string | null;
          notes: string | null;
        };
        Insert: {
          user_id: string;
          created_at?: string;
          added_by?: string | null;
          notes?: string | null;
        };
        Update: {
          user_id?: string;
          created_at?: string;
          added_by?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      user_timetable: {
        Row: {
          user_id: string;
          courses: TimetableCourse[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          courses?: TimetableCourse[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          courses?: TimetableCourse[];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_exams: {
        Row: {
          user_id: string;
          exams: Exam[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          exams?: Exam[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          exams?: Exam[];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_gpa: {
        Row: {
          user_id: string;
          data: GPAData;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          data?: GPAData;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          data?: GPAData;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_assignments: {
        Row: {
          user_id: string;
          assignments: AssignmentRecord[];
          updated_at: string;
        };
        Insert: {
          user_id: string;
          assignments?: AssignmentRecord[];
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          assignments?: AssignmentRecord[];
          updated_at?: string;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          folder_id: string | null;
          tags: string[];
          color: string;
          favorite: boolean;
          pinned: boolean;
          trashed: boolean;
          trashed_at: string | null;
          created_at: string;
          updated_at: string;
          last_opened_at: string | null;
          attachment_ids: string[];
        };
        Insert: {
          id: string;
          user_id: string;
          title?: string;
          content?: string;
          folder_id?: string | null;
          tags?: string[];
          color?: string;
          favorite?: boolean;
          pinned?: boolean;
          trashed?: boolean;
          trashed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_opened_at?: string | null;
          attachment_ids?: string[];
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          content?: string;
          folder_id?: string | null;
          tags?: string[];
          color?: string;
          favorite?: boolean;
          pinned?: boolean;
          trashed?: boolean;
          trashed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          last_opened_at?: string | null;
          attachment_ids?: string[];
        };
        Relationships: [];
      };
      note_folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
          collapsed: boolean | null;
        };
        Insert: {
          id: string;
          user_id: string;
          name: string;
          created_at?: string;
          collapsed?: boolean | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
          collapsed?: boolean | null;
        };
        Relationships: [];
      };
      note_files: {
        Row: {
          id: string;
          user_id: string;
          note_id: string;
          name: string;
          size: number;
          type: string;
          extension: string;
          uploaded_at: string;
          storage_path: string;
          category: string;
        };
        Insert: {
          id: string;
          user_id: string;
          note_id: string;
          name: string;
          size: number;
          type: string;
          extension: string;
          uploaded_at?: string;
          storage_path: string;
          category: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          note_id?: string;
          name?: string;
          size?: number;
          type?: string;
          extension?: string;
          uploaded_at?: string;
          storage_path?: string;
          category?: string;
        };
        Relationships: [];
      };
      ai_chats: {
        Row: { id: string; user_id: string; title: string; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; title?: string; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; title?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
      ai_messages: {
        Row: { id: string; chat_id: string; user_id: string; role: 'user' | 'assistant'; content: string; created_at: string; };
        Insert: { id?: string; chat_id: string; user_id: string; role: 'user' | 'assistant'; content: string; created_at?: string; };
        Update: { id?: string; chat_id?: string; user_id?: string; role?: 'user' | 'assistant'; content?: string; created_at?: string; };
        Relationships: [];
      };
      ai_document_text: {
        Row: { id: string; user_id: string; note_file_id: string; content: string; created_at: string; updated_at: string; };
        Insert: { id?: string; user_id: string; note_file_id: string; content: string; created_at?: string; updated_at?: string; };
        Update: { id?: string; user_id?: string; note_file_id?: string; content?: string; created_at?: string; updated_at?: string; };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
