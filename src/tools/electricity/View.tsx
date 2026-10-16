import { useId } from 'react';
import { z } from 'zod';
import { APPLIANCE_PRESETS, FT_BAHT_PER_KWH, FT_PERIOD, RATES_LAST_VERIFIED, TARIFFS } from '../../data/electricity';
import { Button, Card, Field, NumberInput, Receipt, ReceiptRow, Segmented } from '../../components/ui';
import { useLang } from '../../i18n/lang';
import { S } from '../../i18n/strings';
import { formatBaht } from '../../lib/money';
import { usePersistentState } from '../../lib/usePersistentState';
import { calculateElectricity } from './logic';

const L = {
  modeBill: { th: 'จากหน่วยมิเตอร์', en: 'From meter units' },
  modeAppliance: { th: 'เครื่องใช้ไฟฟ้า', en: 'Appliance' },
  provider: { th: 'การไฟฟ้า', en: 'Provider' },
  tariff: { th: 'ประเภทอัตรา', en: 'Tariff' },
  auto: { th: 'อัตโนมัติ', en: 'Auto' },
  units: { th: 'หน่วยที่ใช้ (kWh)', en: 'Units used (kWh)' },
  unitsHint: { th: 'ดูจากบิล: เลขอ่านครั้งนี้ − ครั้งก่อน', en: 'From your bill: this reading − last reading' },
  watts: { th: 'กำลังไฟ', en: 'Power' },
  hours: { th: 'ชั่วโมง/วัน', en: 'Hours/day' },
  days: { th: 'จำนวนวัน', en: 'Days' },
  base: { th: 'ไฟที่บ้านใช้อยู่แล้ว (ไม่รวมเครื่องนี้)', en: 'Your usual monthly usage (without this)' },
  baseHint: {
    th: 'ใส่เพื่อให้คิดตามขั้นบันไดที่ถูกต้อง ไม่รู้ใส่ 0 ได้',
    en: 'Lets the cost use the right progressive tier. Leave 0 if unsure',
  },
  presets: { th: 'เลือกเร็ว', en: 'Quick pick' },
  energy: { th: 'ค่าพลังงานไฟฟ้า', en: 'Energy charge' },
  service: { th: 'ค่าบริการ', en: 'Service charge' },
  ft: { th: 'ค่า Ft', en: 'Ft' },
  subtotal: { th: 'รวมก่อน VAT', en: 'Before VAT' },
  vat: { th: 'VAT 7%', en: 'VAT 7%' },
  total: { th: 'รวมค่าไฟ', en: 'Total' },
  avg: { th: 'เฉลี่ย', en: 'Average' },
  perUnit: { th: '฿/หน่วย', en: '฿/kWh' },
  energyUsed: { th: 'ใช้ไฟ', en: 'Energy' },
  perDay: { th: 'ต่อวัน', en: 'Per day' },
  cost: { th: 'ค่าไฟเพิ่มขึ้น', en: 'Added to bill' },
  costFor: { th: 'สำหรับ', en: 'for' },
  daysUnit: { th: 'วัน', en: 'days' },
  rate: { th: 'อัตราจริง', en: 'Effective rate' },
  footnote: {
    th: 'อัตราบ้านอยู่อาศัย ไม่รวมส่วนลด/มาตรการพิเศษ · Ft',
    en: 'Residential rates, excluding special discounts · Ft',
  },
  verified: { th: 'ตรวจสอบอัตราล่าสุด', en: 'Rates last verified' },
} as const;

const viewState = z.object({
  mode: z.enum(['bill', 'appliance']),
  provider: z.enum(['MEA', 'PEA']),
  tariff: z.enum(['auto', 'small', 'large']),
  units: z.number().min(0),
  watts: z.number().min(0),
  hoursPerDay: z.number().min(0).max(24),
  days: z.number().int().min(1).max(31),
  baseMonthlyUnits: z.number().min(0),
});
type ViewState = z.infer<typeof viewState>;

const DEFAULTS: ViewState = {
  mode: 'bill',
  provider: 'MEA',
  tariff: 'auto',
  units: 150,
  watts: 1000,
  hoursPerDay: 8,
  days: 30,
  baseMonthlyUnits: 0,
};

export default function ElectricityView() {
  const { t } = useLang();
  const id = useId();
  const [s, setS] = usePersistentState('electricity', viewState, DEFAULTS);
  const set = <K extends keyof ViewState>(k: K) => (v: ViewState[K]) => setS((p) => ({ ...p, [k]: v }));

  const result =
    s.mode === 'bill'
      ? calculateElectricity({ mode: 'bill', units: s.units, provider: s.provider, tariff: s.tariff })
      : calculateElectricity({
          mode: 'appliance',
          watts: s.watts,
          hoursPerDay: s.hoursPerDay,
          days: s.days,
          baseMonthlyUnits: s.baseMonthlyUnits,
          provider: s.provider,
          tariff: s.tariff,
        });

  const tariffLabel = (size: 'small' | 'large') => `${TARIFFS[size].code[s.provider]}`;

  return (
    <div className="space-y-4">
      <Segmented
        label="mode"
        value={s.mode}
        onChange={set('mode')}
        options={[
          { value: 'bill', label: `🧾 ${t(L.modeBill)}` },
          { value: 'appliance', label: `🔌 ${t(L.modeAppliance)}` },
        ]}
      />

      <Card>
        <div className="space-y-4">
          {s.mode === 'bill' ? (
            <Field label={t(L.units)} htmlFor={`${id}-units`} hint={t(L.unitsHint)}>
              <NumberInput id={`${id}-units`} label={t(L.units)} value={s.units} onChange={set('units')} max={100_000} suffix="kWh" />
            </Field>
          ) : (
            <>
              <div>
                <p className="mb-1.5 text-sm font-medium text-ink-soft">{t(L.presets)}</p>
                <div className="flex flex-wrap gap-1.5">
                  {APPLIANCE_PRESETS.map((p) => (
                    <button
                      key={p.name.en}
                      type="button"
                      onClick={() => setS((prev) => ({ ...prev, watts: p.watts, hoursPerDay: p.hoursPerDay }))}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        s.watts === p.watts && s.hoursPerDay === p.hoursPerDay
                          ? 'border-brand bg-brand-soft text-brand-strong'
                          : 'border-line text-ink-soft hover:border-brand'
                      }`}
                    >
                      {p.icon} {t(p.name)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Field label={t(L.watts)} htmlFor={`${id}-w`}>
                  <NumberInput id={`${id}-w`} label={t(L.watts)} value={s.watts} onChange={set('watts')} max={100_000} suffix="W" />
                </Field>
                <Field label={t(L.hours)} htmlFor={`${id}-h`}>
                  <NumberInput id={`${id}-h`} label={t(L.hours)} value={s.hoursPerDay} onChange={set('hoursPerDay')} max={24} />
                </Field>
                <Field label={t(L.days)} htmlFor={`${id}-d`}>
                  <NumberInput id={`${id}-d`} label={t(L.days)} value={s.days} onChange={(n) => set('days')(Math.max(1, n))} min={1} max={31} integer />
                </Field>
              </div>
              <Field label={t(L.base)} htmlFor={`${id}-base`} hint={t(L.baseHint)}>
                <NumberInput id={`${id}-base`} label={t(L.base)} value={s.baseMonthlyUnits} onChange={set('baseMonthlyUnits')} max={100_000} suffix="kWh" />
              </Field>
            </>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t(L.provider)}>
              <Segmented
                label={t(L.provider)}
                value={s.provider}
                onChange={set('provider')}
                options={[
                  { value: 'MEA', label: 'MEA กฟน.' },
                  { value: 'PEA', label: 'PEA กฟภ.' },
                ]}
              />
            </Field>
            <Field label={t(L.tariff)}>
              <Segmented
                label={t(L.tariff)}
                value={s.tariff}
                onChange={set('tariff')}
                options={[
                  { value: 'auto', label: t(L.auto) },
                  { value: 'small', label: tariffLabel('small') },
                  { value: 'large', label: tariffLabel('large') },
                ]}
              />
            </Field>
          </div>
          <p className="-mt-1 text-xs text-ink-soft">
            {TARIFFS[result.tariffSize].code[s.provider]}: {t(TARIFFS[result.tariffSize].label)}
          </p>
        </div>

        <Receipt>
          {result.mode === 'bill' ? (
            <>
              {result.tiers.map((l) => (
                <ReceiptRow
                  key={l.fromKWh}
                  label={
                    <span className="text-xs">
                      {l.fromKWh}–{l.toKWh ?? '∞'} · {l.units} × {l.rate.toFixed(4)}
                    </span>
                  }
                  value={<span className="text-xs">{l.amountBaht.toFixed(2)}</span>}
                />
              ))}
              <div className="my-1 border-t border-current/15" />
              <ReceiptRow label={t(L.energy)} value={result.energyBaht.toFixed(2)} />
              <ReceiptRow label={t(L.service)} value={result.serviceChargeBaht.toFixed(2)} />
              <ReceiptRow label={`${t(L.ft)} (${result.ftRate} × ${result.units})`} value={result.ftBaht.toFixed(2)} />
              <ReceiptRow label={t(L.subtotal)} value={result.subtotalBaht.toFixed(2)} />
              <ReceiptRow label={t(L.vat)} value={result.vatBaht.toFixed(2)} />
              <ReceiptRow label={t(L.total)} value={formatBaht(result.totalBaht, { decimals: 2 })} total />
              <ReceiptRow label={t(L.avg)} value={`${result.averagePerKWh.toFixed(2)} ${t(L.perUnit)}`} />
            </>
          ) : (
            <>
              <ReceiptRow label={t(L.energyUsed)} value={`${result.kWh} kWh (${result.kWhPerDay}/${t(L.daysUnit)})`} />
              <ReceiptRow label={t(L.perDay)} value={formatBaht(result.costPerDayBaht, { decimals: 2 })} />
              <ReceiptRow label={t(L.rate)} value={`${result.effectiveRatePerKWh.toFixed(2)} ${t(L.perUnit)}`} />
              <ReceiptRow
                label={`${t(L.cost)} ${t(L.costFor)} ${s.days} ${t(L.daysUnit)}`}
                value={formatBaht(result.costBaht, { decimals: 2 })}
                total
              />
            </>
          )}
        </Receipt>
      </Card>

      <div className="flex items-start justify-between gap-3 px-1">
        <p className="text-xs leading-relaxed text-ink-soft">
          {t(L.footnote)} {t(FT_PERIOD)} = {FT_BAHT_PER_KWH} {t(L.perUnit)}
          <br />
          {t(L.verified)}: {RATES_LAST_VERIFIED}
        </p>
        <Button variant="ghost" onClick={() => setS(DEFAULTS)}>
          {t(S.reset)}
        </Button>
      </div>
    </div>
  );
}
