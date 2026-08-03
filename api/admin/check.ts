import type { ServerResponse } from 'node:http';
import { requireAdminUser, sendError, sendJson, type VercelRequest } from './_utils.js';

export const runtime = 'nodejs';
export const maxDuration = 60;

export default async function handler(request: VercelRequest, response: ServerResponse): Promise<void> {
  if (request.method !== 'GET') {
    sendError(response, 405, 'method_not_allowed', 'Method not allowed.');
    return;
  }

  try {
    const result = await requireAdminUser(request, response);
    if (!result) return;

    sendJson(response, {
      ok: true,
      authenticatedUserId: result.user.id,
      adminUserId: result.adminUser.user_id,
      email: result.user.email ?? '',
    });
  } catch (error) {
    console.error('[admin-api] Admin check endpoint failed.', {
      path: request.url ?? '/api/admin/check',
      method: request.method ?? 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    const message = error instanceof Error ? error.message : 'Unable to validate the administrator session.';
    sendError(response, 500, 'admin_check_failed', message);
  }
}
