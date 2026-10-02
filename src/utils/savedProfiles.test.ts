import { describe, expect, it, beforeEach } from 'vitest';
import { findProfileById, loadProfiles, saveProfile, clearProfile, __resetCache } from './savedProfiles';

beforeEach(() => {
  localStorage.clear();
  __resetCache();
});

describe('savedProfiles - College / Customer ID', () => {
  it('returns null for empty / short id', () => {
    expect(findProfileById('')).toBeNull();
    expect(findProfileById('  ')).toBeNull();
  });

  it('normalizes id to uppercase without spaces', () => {
    saveProfile({ collegeId: 'muj2024001234', name: 'Aarav', block: 'B1', room: '214', payMode: 'upi', lastUsed: Date.now() });
    expect(findProfileById('MUJ2024001234')).not.toBeNull();
    expect(findProfileById('muj 2024001234')).not.toBeNull();
    expect(findProfileById('  muj2024001234  ')).not.toBeNull();
  });

  it('saves and reloads name + block + room so repeat skips re-typing', () => {
    saveProfile({ collegeId: 'MUJ1', name: 'Aarav', block: 'B2', room: '101', payMode: 'cash', lastUsed: Date.now() });
    const found = findProfileById('MUJ1');
    expect(found?.name).toBe('Aarav');
    expect(found?.block).toBe('B2');
    expect(found?.room).toBe('101');
    expect(found?.payMode).toBe('cash');
    expect(Object.keys(loadProfiles())).toContain('MUJ1');
  });

  it('overwrites same id on second order', () => {
    saveProfile({ collegeId: 'G1001', name: 'Old', block: 'G1', room: '1', payMode: 'upi', lastUsed: 1 });
    saveProfile({ collegeId: 'G1001', name: 'New', block: 'G2', room: '2', payMode: 'card', lastUsed: 2 });
    expect(findProfileById('G1001')?.name).toBe('New');
    expect(findProfileById('G1001')?.block).toBe('G2');
  });

  it('clears a profile', () => {
    saveProfile({ collegeId: 'X1', name: 'A', block: 'B1', room: '', payMode: 'upi', lastUsed: Date.now() });
    clearProfile('X1');
    expect(findProfileById('X1')).toBeNull();
  });

  it('ignores blank collegeId on save', () => {
    saveProfile({ collegeId: '   ', name: 'A', block: 'B1', room: '', payMode: 'upi', lastUsed: Date.now() });
    expect(Object.keys(loadProfiles()).length).toBe(0);
  });

  it('migrates profiles from the legacy unversioned key', () => {
    localStorage.setItem('parallel-eats-profiles', JSON.stringify({
      LEGACY1: { collegeId: 'LEGACY1', name: 'Old', block: 'G1', room: '5', payMode: 'cash', lastUsed: 1 },
    }));
    expect(findProfileById('LEGACY1')?.name).toBe('Old');
    expect(localStorage.getItem('parallel-eats-profiles:v1')).toContain('LEGACY1');
    expect(localStorage.getItem('parallel-eats-profiles')).toBeNull();
  });

  it('reads through the in-memory cache without re-parsing storage', () => {
    saveProfile({ collegeId: 'C1', name: 'Cached', block: 'B1', room: '', payMode: 'upi', lastUsed: Date.now() });
    // Corrupt raw storage behind the cache's back: cached reads still resolve
    localStorage.setItem('parallel-eats-profiles:v1', 'not-json{{{');
    expect(findProfileById('C1')?.name).toBe('Cached');
    __resetCache();
    // After reset the corrupt payload surfaces as empty, no throw
    expect(findProfileById('C1')).toBeNull();
  });
});
