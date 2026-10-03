import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffDashboard } from './StaffDashboard';
import { QROrder } from '../types';

const baseProps = {
  orders: [] as QROrder[],
  outlets: [],
  selectedOutletId: 'x',
  onSelectOutlet: vi.fn(),
  onOrderCreated: vi.fn(),
  onUpdateOrder: vi.fn(),
  onToggleItemStock: vi.fn(),
  onExit: vi.fn(),
};

describe('StaffDashboard', () => {
  it('shows the left rail sections with Queue first', () => {
    render(<StaffDashboard {...baseProps} />);
    const rail = screen.getByRole('complementary', { name: /Staff sections/ });
    expect(rail).toHaveTextContent('Staff dashboard');
    expect(screen.getAllByRole('button', { name: /Kitchen Queue/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('button', { name: /POS & Stock/ }).length).toBeGreaterThan(0);
  });

  it('shows the live order count badge on Queue', () => {
    const orders = [{ orderId: 'RC-1' }, { orderId: 'RC-2' }] as QROrder[];
    render(<StaffDashboard {...baseProps} orders={orders} />);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('switches sections from the rail', async () => {
    const user = userEvent.setup({ delay: null });
    render(<StaffDashboard {...baseProps} />);
    const railButtons = screen.getAllByRole('button', { name: /QR & Setup/ });
    await user.click(railButtons[0]);
    expect(await screen.findByText(/NAME \+ BLOCK REQUIRED/i)).toBeInTheDocument();
  });

  it('exit returns to the customer page', async () => {
    const user = userEvent.setup({ delay: null });
    const onExit = vi.fn();
    render(<StaffDashboard {...baseProps} onExit={onExit} />);
    await user.click(screen.getByRole('button', { name: /Customer page/ }));
    expect(onExit).toHaveBeenCalled();
  });
});
