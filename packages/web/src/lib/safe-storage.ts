/**
 * localStorage can throw (SecurityError) in Safari private mode, strict tracking
 * prevention, or when storage is disabled. Uncaught throws during module init
 * cause a blank white screen — always use these helpers.
 */
const TOKEN_KEY = "cyh_token";

export function safeGetToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function safeSetToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Session may work without persistence
  }
}

export function safeRemoveToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
