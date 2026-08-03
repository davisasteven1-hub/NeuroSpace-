import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Database } from '../../src/types/database';

export type VercelRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
};

const AVATAR_BUCKET = 'avatars';

type AdminLookupRow = Pick<Database['public']['Tables']['admin_users']['Row'], 'user_id'>;

function getRequestPath(request: VercelRequest): string {
  try {
    return new URL(request.url ?? '/', 'http://localhost').pathname;
  } catch {
    return request.url ?? '/';
  }
}

function logAdminInfo(message: string, details?: Record<string, unknown>): void {
  console.info('[admin-api]', message, details ?? {});
}

function logAdminWarn(message: string, details?: Record<string, unknown>): void {
  console.warn('[admin-api]', message, details ?? {});
}

function logAdminError(message: string, details?: Record<string, unknown>): void {
  console.error('[admin-api]', message, details ?? {});
}

export function sendJson(response: ServerResponse, body: unknown, status = 200): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(body));
}

export function sendError(
  response: ServerResponse,
  status: number,
  code: string,
  message: string,
  details?: unknown,
): void {
  sendJson(response, { error: { code, message, details } }, status);
}

export function getServerConfig() {
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    const missingVariables = [
      !supabaseUrl ? 'SUPABASE_URL' : null,
      !serviceRoleKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean);

    logAdminError('Missing required admin environment variables.', {
      missingVariables,
    });

    throw new Error('Admin API configuration is incomplete. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createServiceRoleClient() {
  const { supabaseUrl, serviceRoleKey } = getServerConfig();
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getBearerToken(request: VercelRequest): string | null {
  const header = request.headers.authorization;
  const value = Array.isArray(header) ? header[0] : header;
  if (!value?.startsWith('Bearer ')) return null;
  return value.slice(7).trim() || null;
}

export async function requireAdminUser(request: VercelRequest, response: ServerResponse): Promise<{
  user: User;
  adminClient: ReturnType<typeof createServiceRoleClient>;
  adminUser: AdminLookupRow;
} | null> {
  const token = getBearerToken(request);
  if (!token) {
    logAdminWarn('Rejected admin request without bearer token.', {
      path: getRequestPath(request),
      method: request.method ?? 'GET',
    });
    sendError(response, 401, 'missing_token', 'Authentication is required.');
    return null;
  }

  const adminClient = createServiceRoleClient();
  const { data: authData, error: authError } = await adminClient.auth.getUser(token);
  if (authError || !authData.user) {
    logAdminWarn('Failed to load authenticated admin user.', {
      path: getRequestPath(request),
      method: request.method ?? 'GET',
      error: authError?.message ?? 'No authenticated user returned.',
    });
    sendError(response, 401, 'invalid_session', 'Your session is invalid or expired.');
    return null;
  }

  logAdminInfo('Authenticated user resolved for admin request.', {
    path: getRequestPath(request),
    method: request.method ?? 'GET',
    authenticatedUserId: authData.user.id,
  });

  const { data: adminRow, error: adminError } = await adminClient
    .from('admin_users')
    .select('user_id')
    .eq('user_id', authData.user.id)
    .maybeSingle<AdminLookupRow>();

  if (adminError) {
    logAdminError('Admin lookup query failed.', {
      path: getRequestPath(request),
      method: request.method ?? 'GET',
      authenticatedUserId: authData.user.id,
      error: adminError.message,
    });
    sendError(response, 500, 'admin_check_failed', 'Unable to validate administrator access.', adminError.message);
    return null;
  }

  const isAdmin = adminRow?.user_id === authData.user.id;
  logAdminInfo('Admin lookup completed.', {
    path: getRequestPath(request),
    method: request.method ?? 'GET',
    authenticatedUserId: authData.user.id,
    adminLookupResult: adminRow ? { userId: adminRow.user_id } : null,
    isAdmin,
  });

  if (!isAdmin || !adminRow) {
    sendError(response, 403, 'not_admin', 'You do not have administrator access.');
    return null;
  }

  return { user: authData.user, adminClient, adminUser: adminRow };
}

export async function readRequestBody<T>(request: VercelRequest): Promise<T | null> {
  if (request.body !== undefined) {
    if (typeof request.body === 'string') {
      try {
        return JSON.parse(request.body) as T;
      } catch {
        return null;
      }
    }
    if (typeof request.body === 'object' && request.body !== null) {
      return request.body as T;
    }
  }

  return new Promise((resolve) => {
    let raw = '';
    request.on('data', (chunk: Buffer) => {
      raw += chunk.toString();
    });
    request.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) as T : null);
      } catch {
        resolve(null);
      }
    });
    request.on('error', () => resolve(null));
  });
}

export async function listAllAuthUsers(adminClient: ReturnType<typeof createServiceRoleClient>): Promise<User[]> {
  const perPage = 200;
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < perPage) break;
    page += 1;
  }

  return users;
}

export async function countTableRows(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  table: string,
): Promise<number> {
  const { count, error } = await adminClient.from(table).select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

export function toIso(value: string | null | undefined): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function extractStoragePath(pathOrUrl: string | null | undefined, bucket: string): string | null {
  if (!pathOrUrl) return null;
  if (!pathOrUrl.includes('://')) return pathOrUrl;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const index = pathOrUrl.indexOf(marker);
  if (index === -1) return null;
  return pathOrUrl.slice(index + marker.length).split('?')[0] ?? null;
}

export async function createAvatarUrl(
  adminClient: ReturnType<typeof createServiceRoleClient>,
  profilePictureUrl: string | null | undefined,
): Promise<string | null> {
  const path = extractStoragePath(profilePictureUrl, AVATAR_BUCKET);
  if (!path) return null;

  const { data, error } = await adminClient.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export function parseNumber(value: string | string[] | undefined): number | null {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseString(value: string | string[] | undefined): string {
  const normalized = Array.isArray(value) ? value[0] : value;
  return typeof normalized === 'string' ? normalized.trim() : '';
}
