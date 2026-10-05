import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffLogin } from './StaffLogin';

function mockLoginApi(ok: boolean) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok,
      json: async () =>
        ok
          ? { token: 't.1.s', cafeName: 'ZERO DEGREE CAFE', expiresAt: Date.now() + 3600_000 }
          : { error: 'Wrong PIN for this outlet. Ask the owner for the current staff PIN and try again.' },
    }),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('StaffLogin', () => {
  it('rejects a wrong PIN with a fix, not just failure', async () => {
    mockLoginApi(false);
    const user = userEvent.setup({ delay: null });
    const onLogin = vi.fn();
    render(<StaffLogin onLogin={onLogin} onBack={vi.fn()} />);
    await user.type(screen.getByLabelText(/Staff PIN/), 'wrong-pin');
    await user.click(screen.getByRole('button', { name: /Open staff dashboard/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Ask the owner for the current staff PIN/);
    expect(onLogin).not.toHaveBeenCalled();
  });

  it('opens the dashboard on the correct PIN', async () => {
    mockLoginApi(true);
    const user = userEvent.setup({ delay: null });
    const onLogin = vi.fn();
    render(<StaffLogin onLogin={onLogin} onBack={vi.fn()} />);
    await user.type(screen.getByLabelText(/Staff PIN/), 'correct-pin');
    await user.click(screen.getByRole('button', { name: /Open staff dashboard/ }));
    await vi.waitFor(() => expect(onLogin).toHaveBeenCalledWith('zd-main', 'ZERO DEGREE CAFE'));
  });

  it('goes back to ordering', async () => {
    const user = userEvent.setup({ delay: null });
    const onBack = vi.fn();
    render(<StaffLogin onLogin={vi.fn()} onBack={onBack} />);
    await user.click(screen.getByRole('button', { name: /Back to ordering/ }));
    expect(onBack).toHaveBeenCalled();
  });
});
