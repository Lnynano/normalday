import { useId, useState } from 'react';
import { z } from 'zod';
import { Button, Card, Field, NumberInput, Receipt, ReceiptRow, Segmented, Stepper, Switch } from '../../components/ui';
import { useLang } from '../../i18n/lang';
import { S } from '../../i18n/strings';
import { formatBaht } from '../../lib/money';
import { usePersistentState } from '../../lib/usePersistentState';
import { defaultName, formatSummary, splitBill, type BillSplitInput } from './logic';

const L = {
  modeTotal: { th: 'ยอดรวม', en: 'Total' },
  modeItems: { th: 'แยกรายการ', en: 'By items' },
  people: { th: 'จำนวนคน', en: 'People' },
  names: { th: 'ชื่อ (ไม่ใส่ก็ได้)', en: 'Names (optional)' },
  total: { th: 'ยอดก่อน service/VAT', en: 'Amount before service/VAT' },
  items: { th: 'รายการ', en: 'Items' },
  itemName: { th: 'ชื่อรายการ', en: 'Item' },
  price: { th: 'ราคา', en: 'Price' },
  addItem: { th: '+ เพิ่มรายการ', en: '+ Add item' },
  remove: { th: 'ลบ', en: 'Remove' },
  everyone: { th: 'ทุกคน', en: 'Everyone' },
  sharedHint: { th: 'แตะชื่อเพื่อเลือกคนที่หารรายการนี้', en: 'Tap names to choose who shares this item' },
  service: { th: 'Service charge', en: 'Service charge' },
  vat: { th: 'บวก VAT 7%', en: 'Add VAT 7%' },
  vatHint: { th: 'ปิดไว้ถ้าราคารวม VAT แล้ว', en: 'Leave off if prices already include VAT' },
  rounding: { th: 'ปัดเศษต่อคน', en: 'Round each person' },
  up: { th: 'ปัดขึ้น', en: 'Up' },
  nearest: { th: 'ใกล้สุด', en: 'Nearest' },
  none: { th: 'ไม่ปัด', en: 'Exact' },
  subtotal: { th: 'ค่าอาหาร', en: 'Items' },
  grand: { th: 'ยอดรวม', en: 'Total' },
  collected: { th: 'เก็บได้', en: 'Collected' },
  extra: { th: 'เก็บเกิน', en: 'Extra' },
  short: { th: 'ขาด', en: 'Short' },
  each: { th: 'จ่ายคนละ', en: 'Each pays' },
} as const;

const item = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().min(0),
  sharedBy: z.array(z.number().int().min(0)),
});
const viewState = z.object({
  mode: z.enum(['total', 'items']),
  peopleCount: z.number().int().min(1).max(50),
  names: z.array(z.string()),
  total: z.number().min(0),
  items: z.array(item).min(1),
  servicePercent: z.number().min(0).max(100),
  addVat: z.boolean(),
  rounding: z.enum(['up', 'nearest', 'none']),
});
type ViewState = z.infer<typeof viewState>;
type Item = z.infer<typeof item>;

const newItem = (): Item => ({ id: Math.random().toString(36).slice(2, 9), name: '', price: 0, sharedBy: [] });

const DEFAULTS: ViewState = {
  mode: 'total',
  peopleCount: 2,
  names: [],
  total: 0,
  items: [newItem()],
  servicePercent: 0,
  addVat: false,
  rounding: 'up',
};

/** View state → logic input. Drops people indexes that no longer exist. */
function toInput(s: ViewState): BillSplitInput {
  const base = { peopleCount: s.peopleCount, names: s.names.slice(0, s.peopleCount), servicePercent: s.servicePercent, addVat: s.addVat, rounding: s.rounding };
  if (s.mode === 'total') return { ...base, items: [{ name: '', price: s.total, sharedBy: [] }] };
  return {
    ...base,
    items: s.items.map((i) => ({ name: i.name, price: i.price, sharedBy: i.sharedBy.filter((p) => p < s.peopleCount) })),
  };
}

export default function BillSplitView() {
  const { t, lang } = useLang();
  const id = useId();
  const [s, setS] = usePersistentState('bill-split', viewState, DEFAULTS);
  const [copied, setCopied] = useState(false);
  const set = <K extends keyof ViewState>(k: K) => (v: ViewState[K]) => setS((p) => ({ ...p, [k]: v }));

  const input = toInput(s);
  const out = splitBill(input);
  const nameOf = (i: number) => s.names[i]?.trim() || defaultName(i, lang);
  const everyone = Array.from({ length: s.peopleCount }, (_, i) => i);

  const updateItem = (itemId: string, patch: Partial<Item>) =>
    setS((p) => ({ ...p, items: p.items.map((i) => (i.id === itemId ? { ...i, ...patch } : i)) }));

  const toggleSharer = (it: Item, person: number) => {
    const current = it.sharedBy.filter((p) => p < s.peopleCount);
    const selected = current.length ? current : everyone;
    const next = selected.includes(person) ? selected.filter((p) => p !== person) : [...selected, person].sort((a, b) => a - b);
    if (next.length === 0) return; // someone has to pay for it
    updateItem(it.id, { sharedBy: next.length === s.peopleCount ? [] : next });
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(formatSummary(input, out, lang));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked; nothing else to do
    }
  };

  const allSame = out.people.every((p) => p.payBaht === out.people[0]?.payBaht);

  return (
    <div className="space-y-4">
      <Segmented
        label="mode"
        value={s.mode}
        onChange={set('mode')}
        options={[
          { value: 'total', label: `💵 ${t(L.modeTotal)}` },
          { value: 'items', label: `📝 ${t(L.modeItems)}` },
        ]}
      />

      <Card icon="👥" title={t(L.people)} action={<Stepper label={t(L.people)} value={s.peopleCount} onChange={(n) => set('peopleCount')(Math.max(1, n))} max={50} />}>
        <p className="mb-1.5 text-sm font-medium text-ink-soft">{t(L.names)}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {everyone.map((i) => (
            <input
              key={i}
              aria-label={defaultName(i, lang)}
              placeholder={defaultName(i, lang)}
              value={s.names[i] ?? ''}
              maxLength={30}
              onChange={(e) =>
                setS((p) => {
                  const names = [...p.names];
                  while (names.length <= i) names.push('');
                  names[i] = e.target.value;
                  return { ...p, names };
                })
              }
              className="min-w-0 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none placeholder:text-ink-soft/70 focus:border-brand"
            />
          ))}
        </div>
      </Card>

      {s.mode === 'total' ? (
        <Card>
          <Field label={t(L.total)} htmlFor={`${id}-total`}>
            <NumberInput id={`${id}-total`} label={t(L.total)} value={s.total} onChange={set('total')} max={10_000_000} suffix="฿" />
          </Field>
        </Card>
      ) : (
        <Card icon="📝" title={t(L.items)}>
          <p className="-mt-2 mb-3 text-xs text-ink-soft">{t(L.sharedHint)}</p>
          <ul className="space-y-3">
            {s.items.map((it, n) => {
              const selected = it.sharedBy.filter((p) => p < s.peopleCount);
              return (
                <li key={it.id} className="rounded-xl border border-line p-3">
                  <div className="flex items-center gap-2">
                    <input
                      aria-label={t(L.itemName)}
                      placeholder={`${t(L.itemName)} ${n + 1}`}
                      value={it.name}
                      maxLength={60}
                      onChange={(e) => updateItem(it.id, { name: e.target.value })}
                      className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-brand"
                    />
                    <NumberInput label={t(L.price)} value={it.price} onChange={(v) => updateItem(it.id, { price: v })} max={10_000_000} suffix="฿" className="w-32" />
                    {s.items.length > 1 && (
                      <button
                        type="button"
                        aria-label={t(L.remove)}
                        onClick={() => setS((p) => ({ ...p, items: p.items.filter((i) => i.id !== it.id) }))}
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft hover:bg-surface-2 hover:text-danger"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selected.length === 0 && (
                      <span className="rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-strong">{t(L.everyone)}</span>
                    )}
                    {everyone.map((p) => {
                      const on = selected.length === 0 || selected.includes(p);
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleSharer(it, p)}
                          className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            on ? 'border-brand text-brand-strong' : 'border-line text-ink-soft line-through opacity-60'
                          }`}
                        >
                          {nameOf(p)}
                        </button>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
          <Button variant="ghost" className="mt-2 w-full border border-dashed border-line" onClick={() => setS((p) => ({ ...p, items: [...p.items, newItem()] }))}>
            {t(L.addItem)}
          </Button>
        </Card>
      )}

      <Card>
        <div className="space-y-3">
          <Field label={t(L.service)}>
            <div className="flex gap-2">
              <Segmented
                label={t(L.service)}
                value={s.servicePercent === 0 ? '0' : s.servicePercent === 10 ? '10' : 'custom'}
                onChange={(v) => v !== 'custom' && set('servicePercent')(Number(v))}
                options={[
                  { value: '0', label: '0%' },
                  { value: '10', label: '10%' },
                  { value: 'custom', label: '…' },
                ]}
              />
              <NumberInput label={t(L.service)} value={s.servicePercent} onChange={set('servicePercent')} max={100} suffix="%" className="w-24" />
            </div>
          </Field>
          <div>
            <Switch checked={s.addVat} onChange={set('addVat')} label={t(L.vat)} />
            <p className="text-xs text-ink-soft">{t(L.vatHint)}</p>
          </div>
          <Field label={t(L.rounding)}>
            <Segmented
              label={t(L.rounding)}
              value={s.rounding}
              onChange={set('rounding')}
              options={[
                { value: 'up', label: t(L.up) },
                { value: 'nearest', label: t(L.nearest) },
                { value: 'none', label: t(L.none) },
              ]}
            />
          </Field>
        </div>

        <Receipt>
          <ReceiptRow label={t(L.subtotal)} value={formatBaht(out.subtotalBaht, { decimals: 2 })} />
          {out.serviceChargeBaht > 0 && <ReceiptRow label={`Service ${s.servicePercent}%`} value={formatBaht(out.serviceChargeBaht, { decimals: 2 })} />}
          {out.vatBaht > 0 && <ReceiptRow label="VAT 7%" value={formatBaht(out.vatBaht, { decimals: 2 })} />}
          <ReceiptRow label={t(L.grand)} value={formatBaht(out.totalBaht, { decimals: 2 })} />
          <div className="my-2 border-t border-dashed border-current/25" />
          {allSame && s.peopleCount > 1 ? (
            <ReceiptRow label={`${t(L.each)} (×${s.peopleCount})`} value={formatBaht(out.people[0]?.payBaht ?? 0)} total />
          ) : (
            out.people.map((p) => <ReceiptRow key={p.index} label={nameOf(p.index)} value={formatBaht(p.payBaht)} />)
          )}
          {out.differenceBaht !== 0 && (
            <ReceiptRow
              label={`${t(L.collected)} ${formatBaht(out.collectedBaht)}`}
              value={out.differenceBaht > 0 ? `${t(L.extra)} +${formatBaht(out.differenceBaht)}` : `${t(L.short)} ${formatBaht(-out.differenceBaht)}`}
              tone={out.differenceBaht < 0 ? 'warn' : undefined}
            />
          )}
        </Receipt>

        <div className="mt-3 flex gap-2">
          <Button onClick={copy} className="flex-1">
            {copied ? t(S.copied) : `📋 ${t(S.copy)}`}
          </Button>
          <Button variant="ghost" onClick={() => setS({ ...DEFAULTS, items: [newItem()] })}>
            {t(S.reset)}
          </Button>
        </div>
      </Card>
    </div>
  );
}
