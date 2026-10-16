import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { STORAGE_PREFIX } from '../config';
import { readRaw, writeRaw } from '../lib/storage';
import type { Lang, Localized } from '../tools/types';

const KEY = `${STORAGE_PREFIX}lang`;

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Pick the current-language string from a `{ th, en }` pair. */
  t: (s: Localized) => string;
}

const Ctx = createContext<LangCtx | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => (readRaw(KEY) === 'en' ? 'en' : 'th'));

  useEffect(() => {
    writeRaw(KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((s: Localized) => s[lang], [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang(): LangCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
