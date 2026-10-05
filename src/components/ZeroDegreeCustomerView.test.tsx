import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ZeroDegreeCustomerView } from './ZeroDegreeCustomerView';
import { saveProfile } from '../utils/savedProfiles';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ZeroDegreeCustomerView - College ID + mobile friendly', () => {
  it('shows College ID field so repeat customers skip re-typing', () => {
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    expect(screen.getByPlaceholderText(/College ID/i)).toBeInTheDocument();
  });

  it('auto-fills Name + Block when a saved College ID is typed', async () => {
    saveProfile({ collegeId: 'MUJ2024001234', name: 'Aarav', block: 'B2', room: '214', payMode: 'upi', lastUsed: Date.now() });
    const user = userEvent.setup({ delay: null });
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/College ID/i), 'MUJ2024001234');
    expect(await screen.findByText(/Welcome back, Aarav/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Aarav/i)).toHaveValue('Aarav');
  });

  it('shows category icons with item counts', () => {
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    expect(screen.getByRole('group', { name: /Menu categories/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show .*PIZZA.*12 items/i })).toBeInTheDocument();
  });

  it('tapping a category icon filters the menu to that section', async () => {
    const user = userEvent.setup({ delay: null });
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    expect(screen.getByText('Cold Coffee (Best Buy)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show .*PIZZA.*12 items/i }));
    expect(screen.queryByText('Cold Coffee (Best Buy)')).not.toBeInTheDocument();
    expect(screen.getByText('Classic Margarita (Plain Cheese)')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /All.*19 items/ }));
    expect(screen.getByText('Cold Coffee (Best Buy)')).toBeInTheDocument();
  });

  it('keeps Place button disabled until Name + Block are filled', () => {
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    const buttons = screen.getAllByRole('button', { name: /Add items|Fill Name|Place order|Closed/i });
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect(b).toBeDisabled());
  });

  it('has mobile-friendly touch targets and sticky order bar', () => {
    const { container } = render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    // +/- buttons use w-11 h-11 (44px) for touch
    const touchBtns = container.querySelectorAll('.w-11.h-11');
    expect(touchBtns.length).toBeGreaterThan(0);
    // sticky mobile bar
    const sticky = container.querySelector('.fixed.bottom-0');
    expect(sticky).not.toBeNull();
    // inputs use text-base to prevent iOS zoom
    const inputs = container.querySelectorAll('input.text-base, select.text-base');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('saves College ID profile on placing an order', async () => {
    const user = userEvent.setup({ delay: null });
    const onPlaced = vi.fn();
    localStorage.clear();
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={onPlaced} />);
    // add one item via first + button
    const addBtns = screen.getAllByRole('button', { name: /Add one/ });
    await user.click(addBtns[0]);
    await user.type(screen.getByPlaceholderText(/College ID/i), 'NEW999');
    await user.type(screen.getByPlaceholderText(/e\.g\. Aarav/i), 'Test User');
    await user.type(screen.getByPlaceholderText(/98765/i), '9876543210');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'B1');
    // place via sticky mobile bar (last enabled place button)
    const placeBtns = screen.getAllByRole('button', { name: /Place order/i });
    const enabled = placeBtns.filter((b) => !(b as HTMLButtonElement).disabled);
    expect(enabled.length).toBeGreaterThan(0);
    await user.click(enabled[0]);
    expect(onPlaced).toHaveBeenCalled();
    expect(localStorage.getItem('parallel-eats-profiles:v1')).toContain('NEW999');
    // receipt shown with the bill, ready for the next order
    expect(await screen.findByText(/ORDER SENT/)).toBeInTheDocument();
    expect(screen.getByText(/Total \(incl\. GST \+ packing\)/)).toBeInTheDocument();
  });

  it('requires a valid 10-digit mobile number', async () => {    const user = userEvent.setup({ delay: null });
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    const addBtns = screen.getAllByRole('button', { name: /Add one/ });
    await user.click(addBtns[0]);
    await user.type(screen.getByPlaceholderText(/e\.g\. Aarav/i), 'Test User');
    const selects = screen.getAllByRole('combobox');
    await user.selectOptions(selects[0], 'B1');
    await user.type(screen.getByPlaceholderText(/98765/i), '123');
    await user.tab();
    expect(screen.getByText(/valid 10-digit mobile number/)).toBeInTheDocument();
    const blocked = screen.getAllByRole('button', { name: /Add your 10-digit mobile number/ });
    expect(blocked.length).toBeGreaterThan(0);
    blocked.forEach((b) => expect(b).toBeDisabled());
  });

  it('pulls saved details from the server on a new device via phone number', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          found: true, collegeId: 'MUJ9', name: 'Diya', block: 'G2', room: '305', payMode: 'cash',
        }),
      }),
    );
    const user = userEvent.setup({ delay: null });
    localStorage.clear();
    render(<ZeroDegreeCustomerView isOpen onOrderPlaced={vi.fn()} />);
    await user.type(screen.getByPlaceholderText(/98765/i), '9876500001');
    expect(await screen.findByText(/Found your saved details for 9876500001/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Aarav/i)).toHaveValue('Diya');
  });
});
