import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SiteFooter } from './SiteFooter';

const TABS: [string, string][] = [
  ['customer', 'Customer Page'],
  ['staff', 'Staff Queue (0)'],
];

describe('SiteFooter', () => {
  it('shows brand, pilot outlet and Bharat Parallel credit', () => {
    render(<SiteFooter tabs={TABS} activeTab="customer" onNavigate={vi.fn()} />);
    expect(screen.getByText('Parallel Eats')).toBeInTheDocument();
    expect(screen.getByText(/ZERO DEGREE CAFE/i)).toBeInTheDocument();
    expect(screen.getByText(/\+91 82336 73311/)).toBeInTheDocument();
    expect(screen.getByText(/A Bharat Parallel product/)).toBeInTheDocument();
  });

  it('shows context for the active section', () => {
    render(<SiteFooter tabs={TABS} activeTab="staff" onNavigate={vi.fn()} />);
    expect(screen.getByText(/Staff dashboard: live queue/i)).toBeInTheDocument();
  });

  it('quick links navigate to sections', async () => {
    const user = userEvent.setup({ delay: null });
    const onNavigate = vi.fn();
    render(<SiteFooter tabs={TABS} activeTab="customer" onNavigate={onNavigate} />);
    await user.click(screen.getByRole('button', { name: /Staff Queue/ }));
    expect(onNavigate).toHaveBeenCalledWith('staff');
  });

  it('marks the active section link', () => {
    render(<SiteFooter tabs={TABS} activeTab="customer" onNavigate={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Customer Page' })).toHaveAttribute('aria-current', 'page');
  });
});
