import { describe, expect, it, beforeEach } from 'vitest';
import { loadOrders, saveOrders } from './orderStore';
import { QROrder } from '../types';

const order = (id: string): QROrder =>
  ({ orderId: id, outletId: 'zd-main', items: [], grandTotal: 100 }) as unknown as QROrder;

beforeEach(() => {
  localStorage.clear();
});

describe('orderStore', () => {
  it('round-trips the staff queue', () => {
    saveOrders([order('RC-1'), order('RC-2')]);
    expect(loadOrders().map((o) => o.orderId)).toEqual(['RC-1', 'RC-2']);
  });

  it('returns empty for missing or corrupt data, never throws', () => {
    expect(loadOrders()).toEqual([]);
    localStorage.setItem('pe-staff-orders:v1', 'not-json{{{');
    expect(loadOrders()).toEqual([]);
  });

  it('drops malformed entries and caps at 100', () => {
    const many = Array.from({ length: 120 }, (_, i) => order(`RC-${i}`));
    saveOrders([...many, { nope: true } as unknown as QROrder]);
    const loaded = loadOrders();
    expect(loaded.length).toBe(100);
    expect(loaded.every((o) => typeof o.orderId === 'string')).toBe(true);
  });
});
