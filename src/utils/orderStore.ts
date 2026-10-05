import { QROrder } from '../types';

// Staff queue survives refresh: orders persist on this device only.
// Versioned key; capped so one rush night can't blow the 5MB quota.
const KEY = 'pe-staff-orders:v1';
const MAX_STORED = 100;

export function loadOrders(): QROrder[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((o) => o && typeof o.orderId === 'string').slice(0, MAX_STORED);
  } catch {
    return [];
  }
}

export function saveOrders(orders: QROrder[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(orders.slice(0, MAX_STORED)));
  } catch {
    // quota / private mode - queue stays in memory for this session
  }
}
