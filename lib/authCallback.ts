/**
 * Parse Supabase Auth email-link callbacks (recovery / invite / magic).
 * Supports implicit tokens (#access_token), PKCE (?code=), and token_hash links.
 */

export type AuthCallback =
  | { kind: 'tokens'; access_token: string; refresh_token: string; type?: string }
  | { kind: 'code'; code: string }
  | { kind: 'token_hash'; token_hash: string; type: string }
  | { kind: 'error'; message: string };

type LocationLike = { search?: string; hash?: string };

function paramsFrom(search: string, hash: string): URLSearchParams {
  const merged = new URLSearchParams();
  const q = search?.replace(/^\?/, '') ?? '';
  if (q) {
    for (const [k, v] of new URLSearchParams(q)) merged.set(k, v);
  }
  const h = hash?.replace(/^#/, '') ?? '';
  if (h) {
    for (const [k, v] of new URLSearchParams(h)) merged.set(k, v);
  }
  return merged;
}

export function parseAuthCallbackFromLocation(loc: LocationLike): AuthCallback | null {
  const p = paramsFrom(loc.search ?? '', loc.hash ?? '');

  const error = p.get('error');
  const errorDescription = p.get('error_description');
  if (error || errorDescription) {
    return {
      kind: 'error',
      message: errorDescription?.replace(/\+/g, ' ') || error || 'Auth link error',
    };
  }

  const code = p.get('code');
  if (code) return { kind: 'code', code };

  const access_token = p.get('access_token');
  const refresh_token = p.get('refresh_token');
  if (access_token && refresh_token) {
    return {
      kind: 'tokens',
      access_token,
      refresh_token,
      type: p.get('type') ?? undefined,
    };
  }

  const token_hash = p.get('token_hash');
  const type = p.get('type');
  if (token_hash && type) {
    return { kind: 'token_hash', token_hash, type };
  }

  return null;
}

export function authCallbackHadParams(loc: LocationLike): boolean {
  return parseAuthCallbackFromLocation(loc) != null;
}
