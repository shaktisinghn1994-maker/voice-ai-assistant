import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffAccess } from './StaffAccess';

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe('StaffAccess', () => {
  it('generates a reset code for a signed-in staff member', async () => {
    sessionStorage.setItem(
      'pe-staff-session:v1',
      JSON.stringify({ outletId: 'zd-main', cafeName: 'ZERO DEGREE CAFE', token: 't', loginAt: 1, expiresAt: Date.now() + 3600_000 }),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ code: '482916', expiresInMin: 15 }) }),
    );
    const user = userEvent.setup({ delay: null });
    render(<StaffAccess />);
    await user.click(screen.getByRole('button', { name: /Generate reset code/ }));
    expect(await screen.findByText('482916')).toBeInTheDocument();
  });

  it('completes a reset with code + new PIN', async () => {
    sessionStorage.setItem(
      'pe-staff-session:v1',
      JSON.stringify({ outletId: 'zd-main', cafeName: 'ZERO DEGREE CAFE', token: 't', loginAt: 1, expiresAt: Date.now() + 3600_000 }),
    );
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ code: '482916', expiresInMin: 15 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) });
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup({ delay: null });
    render(<StaffAccess />);
    await user.click(screen.getByRole('button', { name: /Generate reset code/ }));
    await screen.findByText('482916');
    await user.type(screen.getByLabelText(/New PIN/), 'brand-new-pin');
    await user.click(screen.getByRole('button', { name: /Set new PIN/ }));
    expect(await screen.findByText(/PIN updated/)).toBeInTheDocument();
  });
});
