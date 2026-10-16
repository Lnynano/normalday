import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { readJSON, toolKey, writeJSON } from './storage';

function fakeStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: (i) => [...m.keys()][i] ?? null,
    get length() {
      return m.size;
    },
  };
}

const schema = z.object({ n: z.number() });

describe('storage', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('builds versioned keys', () => {
    expect(toolKey('laundry')).toBe('normalday:v1:laundry');
  });

  it('round-trips valid data', () => {
    vi.stubGlobal('localStorage', fakeStorage());
    writeJSON('k', { n: 3 });
    expect(readJSON('k', schema, { n: 0 })).toEqual({ n: 3 });
  });

  it('falls back on corrupt or outdated data', () => {
    const s = fakeStorage();
    vi.stubGlobal('localStorage', s);
    s.setItem('bad', '{not json');
    s.setItem('old', JSON.stringify({ n: 'three' }));
    expect(readJSON('bad', schema, { n: 0 })).toEqual({ n: 0 });
    expect(readJSON('old', schema, { n: 0 })).toEqual({ n: 0 });
  });

  it('survives storage that throws or is missing', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
    });
    expect(() => writeJSON('k', { n: 1 })).not.toThrow();
    expect(readJSON('k', schema, { n: 0 })).toEqual({ n: 0 });
    vi.stubGlobal('localStorage', undefined);
    expect(readJSON('k', schema, { n: 0 })).toEqual({ n: 0 });
  });
});
