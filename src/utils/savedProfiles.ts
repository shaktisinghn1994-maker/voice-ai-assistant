export interface StoredCustomerProfile {
  collegeId: string;
  name: string;
  block: string;
  room: string;
  payMode: 'cash' | 'upi' | 'card';
  phone?: string;
  lastUsed: number;
}

// Versioned key per client-localstorage-schema: bump on shape change + migrate legacy.
const VERSION = 'v1';
const KEY = `parallel-eats-profiles:${VERSION}`;
const LEGACY_KEY = 'parallel-eats-profiles';

function normalizeId(id: string): string {
  return id.trim().toUpperCase().replace(/\s+/g, '');
}

// In-memory cache: localStorage reads are sync + expensive (js-cache-storage).
let cache: Record<string, StoredCustomerProfile> | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY || e.key === LEGACY_KEY) cache = null;
  });
}

function readRaw(key: string): Record<string, StoredCustomerProfile> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return parsed as Record<string, StoredCustomerProfile>;
  } catch {
    return null;
  }
}

function migrateLegacy(): void {
  try {
    if (localStorage.getItem(KEY)) return;
    const legacy = readRaw(LEGACY_KEY);
    if (legacy && Object.keys(legacy).length > 0) {
      localStorage.setItem(KEY, JSON.stringify(legacy));
    }
    localStorage.removeItem(LEGACY_KEY);
  } catch {
    // ignore - ordering still works without saved profiles
  }
}

export function loadProfiles(): Record<string, StoredCustomerProfile> {
  if (cache) return cache;
  migrateLegacy();
  cache = readRaw(KEY) || {};
  return cache;
}

export function findProfileById(collegeId: string): StoredCustomerProfile | null {
  const id = normalizeId(collegeId);
  if (!id) return null;
  const all = loadProfiles();
  return all[id] || null;
}

export function saveProfile(p: StoredCustomerProfile): void {
  try {
    const all = loadProfiles();
    const id = normalizeId(p.collegeId);
    if (!id) return;
    all[id] = { ...p, collegeId: id, lastUsed: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(all));
    cache = all;
  } catch {
    // storage full / private mode - ignore, ordering still works
  }
}

export function clearProfile(collegeId: string): void {
  try {
    const all = loadProfiles();
    delete all[normalizeId(collegeId)];
    localStorage.setItem(KEY, JSON.stringify(all));
    cache = all;
  } catch {
    // ignore
  }
}

/** Test-only: drop the in-memory cache (mirrors a fresh page load). */
export function __resetCache(): void {
  cache = null;
}
