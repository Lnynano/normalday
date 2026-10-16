import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { APP_NAME } from '../config';
import { useLang } from '../i18n/lang';
import { S } from '../i18n/strings';
import { useTheme } from '../lib/theme';

const THEME_ICON = { system: '◐', light: '☀', dark: '☾' } as const;
const THEME_LABEL = { system: S.themeSystem, light: S.themeLight, dark: S.themeDark } as const;

export function Layout({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLang();
  const { pref, cycle } = useTheme();
  const iconBtn = 'grid h-9 min-w-9 place-items-center rounded-xl px-2 text-sm font-semibold text-ink-soft hover:bg-surface-2';

  return (
    <div className="mx-auto min-h-dvh max-w-xl px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-16">
      <header className="mb-5 flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8 rounded-lg" />
          <span className="text-lg tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button type="button" className={iconBtn} onClick={() => setLang(lang === 'th' ? 'en' : 'th')} aria-label={t(S.switchLang)}>
            {lang === 'th' ? 'EN' : 'ไทย'}
          </button>
          <button type="button" className={`${iconBtn} text-base`} onClick={cycle} aria-label={t(THEME_LABEL[pref])} title={t(THEME_LABEL[pref])}>
            {THEME_ICON[pref]}
          </button>
        </div>
      </header>
      {children}
    </div>
  );
}
