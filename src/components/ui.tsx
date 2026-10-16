import { useId, useState, type ReactNode } from 'react';

/* Shared building blocks. Tools compose these so every tool looks alike. */

export function Card({
  title,
  icon,
  action,
  children,
  className = '',
}: {
  title?: ReactNode;
  icon?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-card border border-line bg-surface p-4 shadow-sm ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center gap-2">
          {icon && <span className="text-lg" aria-hidden>{icon}</span>}
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action && <div className="ml-auto">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Number field that lets the user clear it while typing (shows '' instead of
 * snapping back to 0) and strips non-numeric characters.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Number.MAX_SAFE_INTEGER,
  integer = false,
  suffix,
  label,
  id,
  className = '',
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  integer?: boolean;
  suffix?: string;
  label: string;
  id?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className={`flex items-center rounded-xl border border-line bg-surface-2 focus-within:border-brand ${className}`}>
      <input
        id={id}
        aria-label={label}
        inputMode={integer ? 'numeric' : 'decimal'}
        className="w-full min-w-0 bg-transparent px-3 py-2 text-right text-base tabular-nums outline-none"
        value={draft ?? String(value)}
        onFocus={(e) => {
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onChange={(e) => {
          let s = e.target.value.replace(integer ? /[^0-9]/g : /[^0-9.]/g, '');
          const dot = s.indexOf('.');
          if (dot !== -1) s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, '');
          setDraft(s);
          const n = integer ? parseInt(s, 10) : parseFloat(s);
          onChange(clamp(Number.isNaN(n) ? 0 : n, min, max));
        }}
        onBlur={() => setDraft(null)}
      />
      {suffix && <span className="pr-3 text-sm text-ink-soft">{suffix}</span>}
    </div>
  );
}

/** − [n] + counter for whole numbers. */
export function Stepper({
  value,
  onChange,
  label,
  max = 999,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
  max?: number;
}) {
  const btn =
    'grid size-9 place-items-center rounded-lg text-lg font-bold text-brand-strong active:scale-90 active:bg-surface disabled:opacity-30 transition';
  return (
    <div className="flex shrink-0 items-center rounded-xl bg-surface-2 p-0.5">
      <button type="button" className={btn} aria-label={`− ${label}`} disabled={value <= 0} onClick={() => onChange(Math.max(0, value - 1))}>
        −
      </button>
      <input
        aria-label={label}
        inputMode="numeric"
        className="w-10 bg-transparent text-center text-base font-semibold tabular-nums outline-none"
        value={value}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
          onChange(clamp(Number.isNaN(n) ? 0 : n, 0, max));
        }}
      />
      <button type="button" className={btn} aria-label={`+ ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-xl bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex-1 rounded-lg px-2 py-1.5 text-sm font-medium transition ${
            o.value === value ? 'bg-surface text-brand-strong shadow-sm' : 'text-ink-soft'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  const id = useId();
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-3 py-1">
      <span className="text-sm">{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-line'}`}
      >
        <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </label>
  );
}

export function Field({ label, htmlFor, hint, children }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

/** Dark receipt-style result panel (from the original laundry design). */
export function Receipt({ children }: { children: ReactNode }) {
  return <div className="mt-4 rounded-2xl bg-ink px-4 py-3 text-bg dark:bg-surface-2 dark:text-ink">{children}</div>;
}

export function ReceiptRow({
  label,
  value,
  total = false,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  total?: boolean;
  tone?: 'warn';
}) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-0.5 tabular-nums ${
        total ? 'mt-2 border-t border-dashed border-current/25 pt-2 text-base font-semibold' : 'text-sm opacity-85'
      }`}
    >
      <span>{label}</span>
      <span className={`text-right ${total ? 'text-xl font-bold text-coin' : 'font-medium'} ${tone === 'warn' ? 'text-danger' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost';
  className?: string;
}) {
  const styles =
    variant === 'primary'
      ? 'bg-brand text-white hover:bg-brand-strong dark:text-bg'
      : 'text-ink-soft hover:bg-surface-2';
  return (
    <button type="button" onClick={onClick} className={`rounded-xl px-3 py-2 text-sm font-semibold transition active:scale-95 ${styles} ${className}`}>
      {children}
    </button>
  );
}
