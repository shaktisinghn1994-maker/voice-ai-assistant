import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { clearSession, getSession, login } from './staffSession';

function mockLoginApi(ok: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () =>
        ok
          ? { token: 'zd-main.9999999999999.abc123', cafeName: 'ZERO DEGREE CAFE', expiresAt: Date.now() + 3600_000 }
          : { error: 'Wrong PIN for this outlet. Ask the owner for the current staff PIN and try again.' },
    }),
  );
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('staffSession', () => {
  it('logs in through the server and stores the session', async () => {
    mockLoginApi(true);
    const session = await login('zd-main', 'correct-pin');
    expect(session.cafeName).toBe('ZERO DEGREE CAFE');
    expect(getSession()?.token).toBe('zd-main.9999999999999.abc123');
  });

  it('surfaces server rejection with guidance', async () => {
    mockLoginApi(false);
    await expect(login('zd-main', 'wrong')).rejects.toThrow(/current staff PIN/);
    expect(getSession()).toBeNull();
  });

  it('expires sessions past their time', async () => {
    mockLoginApi(true);
    await login('zd-main', 'correct-pin');
    const raw = sessionStorage.getItem('pe-staff-session:v1');
    expect(raw).not.toBeNull();
    sessionStorage.setItem(
      'pe-staff-session:v1',
      JSON.stringify({ ...(JSON.parse(raw as string) as object), expiresAt: Date.now() - 1000 }),
    );
    expect(getSession()).toBeNull();
  });

  it('clears the session on logout', async () => {
    mockLoginApi(true);
    await login('zd-main', 'correct-pin');
    clearSession();
    expect(getSession()).toBeNull();
  });
});
