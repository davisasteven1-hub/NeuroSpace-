import type { ServerResponse } from 'node:http';
import type { AIChat, AIMessage } from '../../../src/types/ai';
import type { Profile } from '../../../src/types/auth';
import type { GPAData } from '../../../src/types/gpa';
import type { Note } from '../../../src/types/notes';
import {
  createAvatarUrl,
  requireAdminUser,
  sendError,
  sendJson,
  toIso,
  type VercelRequest,
} from '../_utils.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

type NoteRow = {
  id: string;
  title: string;
  content: string;
  folder_id: string | null;
  tags: string[];
  color: 'yellow' | 'blue' | 'purple' | 'green' | 'red' | 'gray';
  favorite: boolean;
  pinned: boolean;
  trashed: boolean;
  trashed_at: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  attachment_ids: string[];
};

function getRequestedUserId(request: VercelRequest): string | null {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const segments = url.pathname.split('/').filter(Boolean);
  const userId = segments[segments.length - 1];
  return userId ? decodeURIComponent(userId) : null;
}

function mapNote(note: NoteRow): Note {
  return {
    id: note.id,
    title: note.title,
    content: note.content,
    folderId: note.folder_id,
    tags: note.tags,
    color: note.color,
    favorite: note.favorite,
    pinned: note.pinned,
    trashed: note.trashed,
    trashedAt: note.trashed_at ?? undefined,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
    lastOpenedAt: note.last_opened_at ?? undefined,
    attachmentIds: note.attachment_ids,
  };
}

export default async function handler(request: VercelRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET') {
    sendError(response, 405, 'method_not_allowed', 'Method not allowed.');
    return;
  }

  try {
    const adminContext = await requireAdminUser(request, response);
    if (!adminContext) return;

    const { adminClient } = adminContext;
    const requestedUserId = getRequestedUserId(request);
    if (!requestedUserId) {
      sendError(response, 400, 'missing_user_id', 'A user id is required.');
      return;
    }

    const authResult = await adminClient.auth.admin.getUserById(requestedUserId);
    if (authResult.error || !authResult.data.user) {
      sendError(response, 404, 'user_not_found', 'The requested user could not be found.');
      return;
    }

    const authUser = authResult.data.user;

    const [
      profileResult,
      gpaResult,
      timetableResult,
      examsResult,
      assignmentsResult,
      notesResult,
      filesResult,
      chatsResult,
      recentMessagesResult,
      messagesCountResult,
    ] = await Promise.all([
      adminClient.from('profiles').select('*').eq('id', requestedUserId).maybeSingle(),
      adminClient.from('user_gpa').select('data').eq('user_id', requestedUserId).maybeSingle(),
      adminClient.from('user_timetable').select('courses').eq('user_id', requestedUserId).maybeSingle(),
      adminClient.from('user_exams').select('exams').eq('user_id', requestedUserId).maybeSingle(),
      adminClient.from('user_assignments').select('assignments').eq('user_id', requestedUserId).maybeSingle(),
      adminClient.from('notes').select('*').eq('user_id', requestedUserId).order('updated_at', { ascending: false }),
      adminClient.from('note_files').select('id,note_id,name,size,type,extension,uploaded_at,category').eq('user_id', requestedUserId).order('uploaded_at', { ascending: false }),
      adminClient.from('ai_chats').select('*').eq('user_id', requestedUserId).order('updated_at', { ascending: false }),
      adminClient.from('ai_messages').select('*').eq('user_id', requestedUserId).order('created_at', { ascending: false }).limit(50),
      adminClient.from('ai_messages').select('*', { count: 'exact', head: true }).eq('user_id', requestedUserId),
    ]);

    const results = [
      profileResult,
      gpaResult,
      timetableResult,
      examsResult,
      assignmentsResult,
      notesResult,
      filesResult,
      chatsResult,
      recentMessagesResult,
      messagesCountResult,
    ];
    const failure = results.find((entry) => entry.error);
    if (failure?.error) throw failure.error;

    const notes = (notesResult.data ?? []) as NoteRow[];
    const files = filesResult.data ?? [];
    const noteTitleMap = new Map(notes.map((note) => [note.id, note.title]));
    const avatarUrl = await createAvatarUrl(adminClient, (profileResult.data as Profile | null)?.profile_picture_url ?? null);
    const recentMessages = (recentMessagesResult.data ?? []) as AIMessage[];
    const conversationsList = (chatsResult.data ?? []) as AIChat[];

    sendJson(response, {
      auth: {
        id: authUser.id,
        email: authUser.email ?? '',
        emailVerified: Boolean(authUser.email_confirmed_at),
        createdAt: authUser.created_at,
        lastSignInAt: toIso(authUser.last_sign_in_at),
      },
      profile: (profileResult.data ?? null) as Profile | null,
      avatarUrl,
      gpa: (gpaResult.data?.data ?? null) as GPAData | null,
      timetable: timetableResult.data?.courses ?? [],
      exams: examsResult.data?.exams ?? [],
      assignments: assignmentsResult.data?.assignments ?? [],
      notes: notes.map(mapNote),
      noteFiles: files.map((file) => ({
        id: file.id,
        noteId: file.note_id,
        noteTitle: noteTitleMap.get(file.note_id) ?? null,
        name: file.name,
        size: file.size,
        type: file.type,
        extension: file.extension,
        uploadedAt: file.uploaded_at,
        category: file.category,
      })),
      ai: {
        conversations: conversationsList.length,
        lastInteractionAt: recentMessages[0]?.created_at ?? null,
        totalMessages: messagesCountResult.count ?? 0,
        conversationsList,
        recentMessages,
      },
    });
  } catch (error) {
    console.error('[admin-api] Admin user detail endpoint failed.', {
      path: request.url ?? '/api/admin/users/[id]',
      method: request.method ?? 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const message = error instanceof Error ? error.message : 'Unable to load the administrator user detail.';
    sendError(response, 500, 'admin_user_detail_failed', message);
  }
}
