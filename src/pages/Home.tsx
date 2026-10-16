import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useLang } from '../i18n/lang';
import { S } from '../i18n/strings';
import { tools } from '../tools/registry';
import { searchTools } from '../tools/search';

export default function Home() {
  const { t } = useLang();
  const [q, setQ] = useState('');
  const results = useMemo(() => searchTools(tools, q), [q]);

  return (
    <main>
      <p className="mb-4 text-ink-soft">{t(S.tagline)}</p>

      <div className="relative mb-5">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-soft" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t(S.searchPlaceholder)}
          aria-label={t(S.searchPlaceholder)}
          className="w-full rounded-2xl border border-line bg-surface py-3 pr-4 pl-9 text-base shadow-sm outline-none placeholder:text-ink-soft/70 focus:border-brand"
        />
      </div>

      {results.length === 0 ? (
        <p className="py-10 text-center text-ink-soft">
          {t(S.noResults)} “{q}”
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {results.map((tool) => (
            <li key={tool.id}>
              <Link
                to={`/t/${tool.id}`}
                className="flex h-full flex-col gap-2 rounded-card border border-line bg-surface p-4 shadow-sm transition hover:border-brand active:scale-[0.98]"
              >
                <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-2xl" aria-hidden>
                  {tool.icon}
                </span>
                <span className="font-semibold leading-snug">{t(tool.name)}</span>
                <span className="line-clamp-2 text-xs text-ink-soft">{t(tool.description)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
