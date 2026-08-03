/**
 * Centralized auth redirect URLs for Supabase (email confirm, password reset, OAuth).
 * Production: set VITE_APP_URL to your canonical site URL (no trailing slash).
 * Development: uses the current browser origin when available, or VITE_DEV_APP_URL.
 */

const trimTrailingSlash = (url: string) => url.replace(/\/$/, '');

export function getAppBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_APP_URL?.trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);

  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  const devUrl = import.meta.env.VITE_DEV_APP_URL?.trim();
  if (devUrl) return trimTrailingSlash(devUrl);

  return '';
}

/** Full URL for a path on this app. */
export function getAuthRedirectUrl(path = '/'): string {
  const base = getAppBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (!base) return normalizedPath;
  return new URL(normalizedPath, `${base}/`).toString();
}

/** All Supabase auth emails and OAuth redirects must land here. */
export function getAuthCallbackUrl(): string {
  return getAuthRedirectUrl('/auth/callback');
}

/** Password reset email links redirect here. */
export function getPasswordResetUrl(): string {
  return getAuthRedirectUrl('/auth/reset-password');
}

/** Allowed redirect URLs to register in Supabase Dashboard → Authentication → URL Configuration. */
export function getSupabaseRedirectAllowList(): string[] {
  const urls = new Set<string>([getAuthCallbackUrl(), getPasswordResetUrl()]);

  const appUrl = import.meta.env.VITE_APP_URL?.trim();
  if (appUrl) {
    urls.add(getAuthRedirectUrl('/auth/callback'));
    urls.add(getAuthRedirectUrl('/auth/reset-password'));
  }

  const devUrl = import.meta.env.VITE_DEV_APP_URL?.trim();
  if (devUrl) {
    urls.add(`${trimTrailingSlash(devUrl)}/auth/callback`);
    urls.add(`${trimTrailingSlash(devUrl)}/auth/reset-password`);
  }

  return [...urls];
}
