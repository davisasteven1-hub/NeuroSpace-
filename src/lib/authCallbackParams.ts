export type AuthCallbackType = 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change' | null;

export type ParsedAuthCallback = {
  type: AuthCallbackType;
  error: string | null;
  errorDescription: string | null;
  errorCode: string | null;
  hasAuthTokens: boolean;
  authCode: string | null;
};

export type AuthCallbackErrorKind = 'invalid' | 'expired' | 'generic';

export function parseAuthCallbackUrl(url: string): ParsedAuthCallback {
  const parsed = new URL(url);
  const hashParams = new URLSearchParams(parsed.hash.startsWith('#') ? parsed.hash.slice(1) : parsed.hash);
  const searchParams = parsed.searchParams;

  const typeRaw = hashParams.get('type') || searchParams.get('type');
  const type = typeRaw as AuthCallbackType;

  return {
    type: typeRaw ? type : null,
    error: searchParams.get('error') || hashParams.get('error'),
    errorDescription: searchParams.get('error_description') || hashParams.get('error_description'),
    errorCode: searchParams.get('error_code') || hashParams.get('error_code'),
    hasAuthTokens: Boolean(
      hashParams.get('access_token')
      || hashParams.get('refresh_token')
      || searchParams.get('access_token')
      || searchParams.get('code'),
    ),
    authCode: searchParams.get('code'),
  };
}

export function classifyAuthCallbackError(
  error: string | null,
  errorDescription: string | null,
  errorCode: string | null,
): AuthCallbackErrorKind {
  const combined = `${error ?? ''} ${errorDescription ?? ''} ${errorCode ?? ''}`.toLowerCase();

  if (
    combined.includes('expired')
    || combined.includes('otp_expired')
    || errorCode === 'otp_expired'
    || error === 'otp_expired'
  ) {
    return 'expired';
  }

  if (
    combined.includes('invalid')
    || combined.includes('access_denied')
    || error === 'access_denied'
    || errorCode === 'validation_failed'
  ) {
    return 'invalid';
  }

  return 'generic';
}

export function clearAuthCallbackParamsFromUrl(): void {
  if (typeof window === 'undefined') return;
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
}

export function mapSessionErrorToKind(message: string): AuthCallbackErrorKind {
  const lower = message.toLowerCase();
  if (lower.includes('expired')) return 'expired';
  if (lower.includes('invalid') || lower.includes('malformed')) return 'invalid';
  return 'generic';
}
