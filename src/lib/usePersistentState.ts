import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { z } from 'zod';
import { readJSON, toolKey, writeJSON } from './storage';

/**
 * useState that remembers the last value per tool in localStorage.
 * Stored data is validated against `schema`; anything invalid is ignored.
 */
export function usePersistentState<T>(
  toolId: string,
  schema: z.ZodType<T>,
  initial: T,
): [T, Dispatch<SetStateAction<T>>] {
  const key = toolKey(toolId);
  const [value, setValue] = useState<T>(() => readJSON(key, schema, initial));
  useEffect(() => writeJSON(key, value), [key, value]);
  return [value, setValue];
}
