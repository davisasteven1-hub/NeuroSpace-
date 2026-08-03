export type UserRole = 'student' | 'moderator' | 'owner';

export interface Profile {
  id: string;
  role: UserRole;
  profile_picture_url: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthContextValue {
  userId: string | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  isAuthenticated: boolean;
  canModerate: boolean;
  canManage: boolean;
}
