import { Suspense, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { APP_NAME } from '../config';
import { useLang } from '../i18n/lang';
import { S } from '../i18n/strings';
import { getTool } from '../tools/registry';
import { toolViews } from '../tools/views';

export default function ToolPage() {
  const { id = '' } = useParams();
  const { t } = useLang();
  const tool = getTool(id);
  const View = toolViews[id];

  useEffect(() => {
    document.title = tool ? `${t(tool.name)} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = APP_NAME;
    };
  }, [tool, t]);

  if (!tool || !View) {
    return (
      <main className="py-10 text-center">
        <p className="mb-4 text-ink-soft">{t(S.notFound)}</p>
        <Link to="/" className="font-semibold text-brand">
          ← {t(S.back)}
        </Link>
      </main>
    );
  }

  return (
    <main>
      <Link to="/" className="mb-3 inline-block text-sm font-medium text-ink-soft hover:text-brand">
        ← {t(S.back)}
      </Link>
      <div className="mb-5 flex items-start gap-3">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-2xl" aria-hidden>
          {tool.icon}
        </span>
        <div>
          <h1 className="text-xl font-bold leading-tight">{t(tool.name)}</h1>
          <p className="text-sm text-ink-soft">{t(tool.description)}</p>
        </div>
      </div>
      <Suspense fallback={<p className="py-10 text-center text-ink-soft">{t(S.loading)}</p>}>
        <View />
      </Suspense>
    </main>
  );
}
