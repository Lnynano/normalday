import { LAUNDRY_GROUPS, LAUNDRY_ITEMS, LAUNDRY_MACHINES, type LaundryGroup, type Temperature } from '../../data/laundry';
import { Button, Card, Receipt, ReceiptRow, Stepper } from '../../components/ui';
import { useLang } from '../../i18n/lang';
import { S } from '../../i18n/strings';
import { formatBaht } from '../../lib/money';
import { usePersistentState } from '../../lib/usePersistentState';
import { calculateLaundry, laundryInput, type LaundryInput } from './logic';

const L = {
  machine: { th: 'เครื่อง', en: 'Machine' },
  temp: { th: 'น้ำ', en: 'Water' },
  price: { th: 'ราคา', en: 'Price' },
  total: { th: 'รวมทั้งหมด', en: 'Total' },
  split: { th: 'เกิน 18 kg — แบ่งซัก 2 รอบ', en: 'Over 18 kg — split into 2 washes' },
  each: { th: 'ชิ้นละ ~', en: '~' },
  priceRef: { th: 'ตารางราคา', en: 'Price reference' },
  note: { th: 'น้ำหนักเป็นค่าประมาณ ขึ้นกับเนื้อผ้า', en: 'Weights are estimates and vary by fabric' },
  empty: { th: 'กด + เพื่อนับเสื้อผ้า', en: 'Tap + to count clothes' },
} as const;

const TEMP: Record<Temperature, { th: string; en: string }> = {
  cold: { th: 'น้ำเย็น', en: 'Cold' },
  warm: { th: 'น้ำอุ่น', en: 'Warm' },
  hot: { th: 'น้ำร้อน', en: 'Hot' },
};

const MAX_G = LAUNDRY_MACHINES[LAUNDRY_MACHINES.length - 1]!.kg;
const BAR_COLOR = ['bg-brand', 'bg-accent', 'bg-danger'];

const EMPTY: LaundryInput = laundryInput.parse({});

export default function LaundryView() {
  const { t } = useLang();
  const [counts, setCounts] = usePersistentState('laundry', laundryInput, EMPTY);
  const result = calculateLaundry(counts);

  const groupCard = (group: LaundryGroup) => {
    const load = result.loads.find((l) => l.group === group);
    const machineIdx = load ? LAUNDRY_MACHINES.findIndex((m) => m.kg === load.machineKg) : 0;
    const pct = load ? Math.min(100, (load.weightKg / MAX_G) * 100) : 0;
    const meta = LAUNDRY_GROUPS[group];
    return (
      <Card key={group} icon={meta.icon} title={t(meta.name)}>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-2xl font-bold tabular-nums">
            {(load?.weightKg ?? 0).toFixed(2)} <span className="text-sm font-medium text-ink-soft">kg</span>
          </span>
          <span className="text-xs text-ink-soft tabular-nums">/ {MAX_G} kg</span>
        </div>
        <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
          <div
            className={`h-full rounded-full transition-all duration-300 ${load?.overCapacity ? 'bg-danger' : BAR_COLOR[machineIdx]}`}
            style={{ width: `${pct}%` }}
          />
        </div>

        <ul className="divide-y divide-line">
          {LAUNDRY_ITEMS.filter((i) => i.group === group).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t(item.name)}</div>
                <div className="text-xs text-ink-soft">
                  {t(L.each)}
                  {item.grams} g
                </div>
              </div>
              <Stepper
                label={t(item.name)}
                value={counts[item.id]}
                onChange={(n) => setCounts((c) => ({ ...c, [item.id]: n }))}
              />
            </li>
          ))}
        </ul>

        <Receipt>
          {load ? (
            <>
              <ReceiptRow label={t(L.machine)} value={`${load.machineKg} kg`} />
              <ReceiptRow label={t(L.temp)} value={t(TEMP[load.temperature])} />
              {load.overCapacity && <ReceiptRow label="⚠" value={t(L.split)} tone="warn" />}
              <ReceiptRow label={t(L.price)} value={formatBaht(load.priceBaht)} total />
            </>
          ) : (
            <p className="py-1 text-center text-sm opacity-70">{t(L.empty)}</p>
          )}
        </Receipt>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {groupCard('upper')}
      {groupCard('lower')}

      {result.loads.length > 1 && (
        <Card>
          <div className="flex items-baseline justify-between">
            <span className="font-semibold">{t(L.total)}</span>
            <span className="text-2xl font-bold text-coin tabular-nums">{formatBaht(result.totalBaht)}</span>
          </div>
        </Card>
      )}

      <Card icon="📋" title={t(L.priceRef)} action={<Button variant="ghost" onClick={() => setCounts(EMPTY)}>{t(S.reset)}</Button>}>
        <table className="w-full text-sm tabular-nums">
          <thead>
            <tr className="text-ink-soft">
              <th className="pb-1 text-left font-medium">{t(L.machine)}</th>
              {(['cold', 'warm', 'hot'] as const).map((k) => (
                <th key={k} className="pb-1 text-right font-medium">
                  {t(TEMP[k])}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LAUNDRY_MACHINES.map((m) => (
              <tr key={m.kg} className="border-t border-line">
                <td className="py-1.5 text-ink-soft">{m.kg} kg</td>
                <td className="py-1.5 text-right">{m.price.cold} ฿</td>
                <td className="py-1.5 text-right">{m.price.warm} ฿</td>
                <td className="py-1.5 text-right">{m.price.hot} ฿</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-xs text-ink-soft">{t(L.note)}</p>
      </Card>
    </div>
  );
}
