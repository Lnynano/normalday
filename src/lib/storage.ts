import type { z } from 'zod';
import { STORAGE_PREFIX, STORAGE_VERSION } from '../config';

/** Key for per-tool saved inputs, e.g. `normalday:v1:laundry`. */
export function toolKey(toolId: string): string {
  return `${STORAGE_PREFIX}${STORAGE_VERSION}:${toolId}`;
}

/**
 * localStorage can be missing or throw (private mode, blocked storage, quota),
 * so every access goes through these helpers and fails soft.
 */
export function readRaw(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeRaw(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch {
    // ignore: saving is a convenience, not a requirement
  }
}

/** Read JSON and validate it; falls back when missing, corrupt or from an older shape. */
export function readJSON<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): void {
  writeRaw(key, JSON.stringify(value));
}
