import { useEffect, useState } from 'react';
import { STORAGE_PREFIX } from '../config';
import { readRaw, writeRaw } from './storage';

export type ThemePref = 'system' | 'light' | 'dark';
const KEY = `${STORAGE_PREFIX}theme`;
const ORDER: ThemePref[] = ['system', 'light', 'dark'];

function readPref(): ThemePref {
  const v = readRaw(KEY);
  return v === 'light' || v === 'dark' ? v : 'system';
}

/** Theme preference with a `.dark` class on <html>. index.html applies it pre-paint too. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref);

  useEffect(() => {
    writeRaw(KEY, pref);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      document.documentElement.classList.toggle('dark', pref === 'dark' || (pref === 'system' && mq.matches));
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [pref]);

  const cycle = () => setPref((p) => ORDER[(ORDER.indexOf(p) + 1) % ORDER.length]!);
  return { pref, cycle };
}
