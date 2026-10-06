import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StaffQueueView } from './StaffQueueView';
import { QROrder } from '../types';

const order = (overrides: Partial<QROrder> = {}): QROrder =>
  ({
    orderId: 'RC-100',
    outletId: 'zd-main',
    customerPhone: '+91 9820400001',
    customerName: 'Aarav',
    isRepeat: false,
    trustTier: 'new_unknown',
    items: [{ item_id: 'fr1', item_name: 'Salted Fries', variation_id: '', variation_name: '', quantity: 2, unit_price: 80, addons: [], total_price: 160 }],
    subtotal: 160,
    cgst: 4,
    sgst: 4,
    packagingCharge: 10,
    deliveryCharge: 0,
    grandTotal: 178,
    advancePaid: 0,
    paymentMode: 'COD',
    paymentStatus: 'unpaid',
    status: 'pending_staff_accept',
    blockNumber: 'B1',
    roomNo: '214',
    createdAt: 'now',
    ...overrides,
  }) as QROrder;

const props = { onUpdate: vi.fn(), onDelete: vi.fn() };

describe('StaffQueueView', () => {
  it('shows big readable rows with Punched / Preparing / Dispatched actions', () => {
    render(<StaffQueueView orders={[order()]} {...props} />);
    expect(screen.getByText('Aarav')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Punched/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Preparing$/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Dispatched$/ })).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('copies name and number', async () => {
    const user = userEvent.setup({ delay: null });
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<StaffQueueView orders={[order()]} {...props} />);
    await user.click(screen.getByRole('button', { name: /Copy customer name/ }));
    expect(writeText).toHaveBeenCalledWith('Aarav');
    await user.click(screen.getByRole('button', { name: /Copy phone number/ }));
    expect(writeText).toHaveBeenCalledWith('+91 9820400001');
    vi.unstubAllGlobals();
  });

  it('advances Punched then Preparing then Dispatched', async () => {
    const user = userEvent.setup({ delay: null });
    const onUpdate = vi.fn();
    render(<StaffQueueView orders={[order()]} onUpdate={onUpdate} onDelete={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: /Punched/ }));
    expect(onUpdate).toHaveBeenCalledWith('RC-100', expect.objectContaining({ status: 'pushed_to_petpooja' }));
  });

  it('deletes only with the PIN', async () => {
    const user = userEvent.setup({ delay: null });
    const onDelete = vi.fn();
    render(<StaffQueueView orders={[order()]} onUpdate={vi.fn()} onDelete={onDelete} />);
    await user.click(screen.getByRole('button', { name: /^Delete$/ }));
    await user.type(screen.getByLabelText(/Delete PIN/), 'wrong');
    await user.click(screen.getByRole('button', { name: /^Delete$/ }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Wrong PIN/);
    expect(onDelete).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText(/Delete PIN/));
    await user.type(screen.getByLabelText(/Delete PIN/), '1234');
    await user.click(screen.getByRole('button', { name: /^Delete$/ }));
    expect(onDelete).toHaveBeenCalledWith('RC-100');
  });
});
