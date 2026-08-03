import type { AdminApiErrorPayload, AdminUserDetail, AdminUsersResponse, VerificationFilter } from '../types/admin';

export interface AdminCheckResponse {
  ok: true;
  authenticatedUserId: string;
  adminUserId: string;
  email: string;
}

export class AdminApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | null | undefined;

function buildQuery(params: Record<string, QueryValue>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined || value === '') continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

async function fetchAdminJson<T>(path: string, accessToken: string): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = await response.json().catch(() => null) as T | AdminApiErrorPayload | null;
  if (!response.ok) {
    const errorPayload = payload && typeof payload === 'object' && 'error' in payload
      ? payload.error
      : null;
    const message = errorPayload
      ? errorPayload.message
      : 'Unable to complete the administrator request.';
    throw new AdminApiError(message, response.status, errorPayload?.code);
  }

  if (!payload) {
    throw new Error('The administrator endpoint returned an empty response.');
  }

  return payload as T;
}

export async function verifyAdminAccess(accessToken: string): Promise<AdminCheckResponse> {
  return fetchAdminJson<AdminCheckResponse>('/api/admin/check', accessToken);
}

export async function fetchAdminUsers(
  accessToken: string,
  params: {
    search?: string;
    verification?: VerificationFilter;
    gpaMin?: number | null;
    gpaMax?: number | null;
    page?: number;
    pageSize?: number;
  },
): Promise<AdminUsersResponse> {
  const query = buildQuery({
    search: params.search,
    verification: params.verification,
    gpaMin: params.gpaMin,
    gpaMax: params.gpaMax,
    page: params.page,
    pageSize: params.pageSize,
  });

  return fetchAdminJson<AdminUsersResponse>(`/api/admin/users${query}`, accessToken);
}

export async function fetchAdminUserDetail(accessToken: string, userId: string): Promise<AdminUserDetail> {
  return fetchAdminJson<AdminUserDetail>(`/api/admin/users/${encodeURIComponent(userId)}`, accessToken);
}
