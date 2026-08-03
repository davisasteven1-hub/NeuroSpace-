import type { ServerResponse } from 'node:http';
import type { User } from '@supabase/supabase-js';
import type { GPAData } from '../../src/types/gpa';
import {
  chunkArray,
  countTableRows,
  createAvatarUrl,
  listAllAuthUsers,
  requireAdminUser,
  sendError,
  sendJson,
  toIso,
  type VercelRequest,
} from './_utils.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

const ACTIVE_WINDOW_DAYS = 30;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;
const GRADE_POINTS: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

type ProfileRow = {
  id: string;
  display_name: string | null;
  profile_picture_url: string | null;
};

type GpaRow = {
  user_id: string;
  data: GPAData | null;
};

function getDisplayName(user: User, profile: ProfileRow | null): string | null {
  if (profile?.display_name?.trim()) return profile.display_name.trim();
  const metadataName = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim() : '';
  if (metadataName) return metadataName;
  return user.email?.split('@')[0] ?? null;
}

function calculateCurrentGpa(data: GPAData | null | undefined): number | null {
  const semesters = data?.semesters ?? [];
  let totalUnits = 0;
  let totalPoints = 0;

  for (const semester of semesters) {
    for (const course of semester.courses ?? []) {
      const units = Number(course.units) || 0;
      const gradePoint = GRADE_POINTS[course.grade] ?? 0;
      totalUnits += units;
      totalPoints += units * gradePoint;
    }
  }

  if (!totalUnits) return null;
  return Number((totalPoints / totalUnits).toFixed(2));
}

function parseFilters(request: VercelRequest) {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const search = url.searchParams.get('search')?.trim() ?? '';
  const verification = url.searchParams.get('verification') === 'verified'
    ? 'verified'
    : url.searchParams.get('verification') === 'unverified'
      ? 'unverified'
      : 'all';
  const gpaMinParam = url.searchParams.get('gpaMin');
  const gpaMaxParam = url.searchParams.get('gpaMax');
  const pageParam = Number(url.searchParams.get('page') ?? '1');
  const pageSizeParam = Number(url.searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE.toString());

  const gpaMin = gpaMinParam === null || gpaMinParam === '' ? null : Number(gpaMinParam);
  const gpaMax = gpaMaxParam === null || gpaMaxParam === '' ? null : Number(gpaMaxParam);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam > 0
    ? Math.min(Math.floor(pageSizeParam), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  return {
    search: search.toLowerCase(),
    rawSearch: search,
    verification,
    gpaMin: Number.isFinite(gpaMin) ? gpaMin : null,
    gpaMax: Number.isFinite(gpaMax) ? gpaMax : null,
    page,
    pageSize,
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
    const filters = parseFilters(request);
    const authUsers = await listAllAuthUsers(adminClient);
    const userIds = authUsers.map((entry) => entry.id);

    const profileRows: ProfileRow[] = [];
    const gpaRows: GpaRow[] = [];

    for (const chunk of chunkArray(userIds, 200)) {
      if (!chunk.length) continue;

      const [profilesResult, gpaResult] = await Promise.all([
        adminClient.from('profiles').select('id,display_name,profile_picture_url').in('id', chunk),
        adminClient.from('user_gpa').select('user_id,data').in('user_id', chunk),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (gpaResult.error) throw gpaResult.error;

      profileRows.push(...(profilesResult.data ?? []));
      gpaRows.push(...(gpaResult.data ?? []));
    }

    const profileMap = new Map(profileRows.map((row) => [row.id, row]));
    const gpaMap = new Map(gpaRows.map((row) => [row.user_id, calculateCurrentGpa(row.data)]));
    const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const baseUsers = authUsers.map((entry) => {
      const profile = profileMap.get(entry.id) ?? null;
      const currentGpa = gpaMap.get(entry.id) ?? null;
      return {
        user: entry,
        id: entry.id,
        email: entry.email ?? '',
        emailVerified: Boolean(entry.email_confirmed_at),
        createdAt: entry.created_at,
        lastSignInAt: toIso(entry.last_sign_in_at),
        displayName: getDisplayName(entry, profile),
        currentGpa,
        profilePictureUrl: profile?.profile_picture_url ?? null,
      };
    });

    const filtered = baseUsers.filter((entry) => {
      const matchesSearch = !filters.search
        || entry.email.toLowerCase().includes(filters.search)
        || (entry.displayName ?? '').toLowerCase().includes(filters.search);
      const matchesVerification = filters.verification === 'all'
        || (filters.verification === 'verified' && entry.emailVerified)
        || (filters.verification === 'unverified' && !entry.emailVerified);
      const matchesGpaMin = filters.gpaMin === null || (entry.currentGpa ?? -Infinity) >= filters.gpaMin;
      const matchesGpaMax = filters.gpaMax === null || (entry.currentGpa ?? Infinity) <= filters.gpaMax;
      return matchesSearch && matchesVerification && matchesGpaMin && matchesGpaMax;
    });

    filtered.sort((left, right) => {
      const rightTime = new Date(right.createdAt).getTime();
      const leftTime = new Date(left.createdAt).getTime();
      return rightTime - leftTime;
    });

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
    const page = Math.min(filters.page, totalPages);
    const start = (page - 1) * filters.pageSize;
    const paginated = filtered.slice(start, start + filters.pageSize);

    const users = await Promise.all(paginated.map(async (entry) => ({
      id: entry.id,
      email: entry.email,
      emailVerified: entry.emailVerified,
      createdAt: entry.createdAt,
      lastSignInAt: entry.lastSignInAt,
      displayName: entry.displayName,
      avatarUrl: await createAvatarUrl(adminClient, entry.profilePictureUrl),
      currentGpa: entry.currentGpa,
    })));

    const [userGpa, userTimetable, userExams, userAssignments, notes, noteFiles, aiChats, aiMessages] = await Promise.all([
      countTableRows(adminClient, 'user_gpa'),
      countTableRows(adminClient, 'user_timetable'),
      countTableRows(adminClient, 'user_exams'),
      countTableRows(adminClient, 'user_assignments'),
      countTableRows(adminClient, 'notes'),
      countTableRows(adminClient, 'note_files'),
      countTableRows(adminClient, 'ai_chats'),
      countTableRows(adminClient, 'ai_messages'),
    ]);

    const verifiedUsers = baseUsers.filter((entry) => entry.emailVerified).length;
    const unverifiedUsers = baseUsers.length - verifiedUsers;
    const activeUsers = baseUsers.filter((entry) => entry.lastSignInAt && new Date(entry.lastSignInAt).getTime() >= activeCutoff).length;

    sendJson(response, {
      overview: {
        totalUsers: baseUsers.length,
        verifiedUsers,
        unverifiedUsers,
        activeUsers,
        activeWindowDays: ACTIVE_WINDOW_DAYS,
        academicTotals: {
          userGpa,
          userTimetable,
          userExams,
          userAssignments,
          notes,
          noteFiles,
          aiChats,
          aiMessages,
        },
      },
      users,
      filters: {
        search: filters.rawSearch,
        verification: filters.verification,
        gpaMin: filters.gpaMin,
        gpaMax: filters.gpaMax,
        page,
        pageSize: filters.pageSize,
      },
      pagination: {
        total,
        page,
        pageSize: filters.pageSize,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    console.error('[admin-api] Admin users endpoint failed.', {
      path: request.url ?? '/api/admin/users',
      method: request.method ?? 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const message = error instanceof Error ? error.message : 'Unable to load administrator user data.';
    sendError(response, 500, 'admin_users_failed', message);
  }
}
