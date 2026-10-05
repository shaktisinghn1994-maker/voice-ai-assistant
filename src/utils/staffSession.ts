export interface StaffSession {
  outletId: string;
  cafeName: string;
  token: string;
  loginAt: number;
  expiresAt: number;
}

// 12-hour staff sessions, cleared with the tab (sessionStorage).
// PINs are verified server-side (/api/staff/login) so they never ship
// in the client bundle. The token is opaque to the client; it only
// gates the dashboard UI — server routes enforce their own checks.
const KEY = 'pe-staff-session:v1';

export async function login(outletId: string, pin: string): Promise<StaffSession> {
  const res = await fetch('/api/staff/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ outletId, pin }),
  });
  const data = (await res.json()) as { error?: string; token?: string; cafeName?: string; expiresAt?: number };
  if (!res.ok || !data.token || !data.cafeName || !data.expiresAt) {
    throw new Error(data.error ?? 'Login failed. Try again.');
  }
  const session: StaffSession = {
    outletId,
    cafeName: data.cafeName,
    token: data.token,
    loginAt: Date.now(),
    expiresAt: data.expiresAt,
  };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // private mode - session lives in memory only
  }
  return session;
}

export function getSession(): StaffSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as StaffSession;
    if (!session.expiresAt || !session.token || Date.now() > session.expiresAt) {
      sessionStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
