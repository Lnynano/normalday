/**
 * Thai residential electricity rates (บ้านอยู่อาศัย).
 *
 * ⚠ Ft changes every 4 months (periods Jan–Apr, May–Aug, Sep–Dec), and the
 *   base tiers change occasionally. Update FT_BAHT_PER_KWH, FT_PERIOD and
 *   RATES_LAST_VERIFIED when a new period starts.
 *
 * Sources (checked 2026-10-17):
 * - Ft Sep–Dec 2026 = 16.23 satang/kWh (กกพ. / ERC): https://www.erc.or.th/th/automatic/
 * - New progressive tiers from Sep 2026 bills (first 200 kWh capped at 3.00 ฿,
 *   public-lighting cost 0.0634 ฿ removed above 200 kWh):
 *   https://ratchaburi.prd.go.th/th/content/category/detail/id/57/iid/531696
 *   https://it24hrs.com/2026/new-electricity-rates/
 *
 * MEA (กฟน.: Bangkok, Nonthaburi, Samut Prakan) and PEA (กฟภ.: rest of the
 * country) currently use the same residential rates; only the tariff codes
 * differ. Kept per-provider so they can diverge later.
 */

export const RATES_LAST_VERIFIED = '2026-10-17';
export const FT_PERIOD = { th: 'ก.ย.–ธ.ค. 2569', en: 'Sep–Dec 2026' };
export const FT_BAHT_PER_KWH = 0.1623;

export type Provider = 'MEA' | 'PEA';
export type TariffSize = 'small' | 'large';

/** `upTo` is the inclusive upper bound of the tier in kWh; null = no limit. */
export interface Tier {
  upTo: number | null;
  rate: number;
}

export interface Tariff {
  /** Tariff code printed on the bill, per provider. */
  code: Record<Provider, string>;
  label: { th: string; en: string };
  serviceChargeBaht: number;
  tiers: Tier[];
}

export const TARIFFS: Record<TariffSize, Tariff> = {
  /** ≤150 kWh/month on average (small meter). */
  small: {
    code: { MEA: '1.1', PEA: '1.1.1' },
    label: { th: 'ใช้ไม่เกิน 150 หน่วย/เดือน', en: 'Up to 150 kWh/month' },
    serviceChargeBaht: 8.19,
    tiers: [
      { upTo: 15, rate: 2.3488 },
      { upTo: 25, rate: 2.9882 },
      { upTo: 200, rate: 3.0 }, // 26–200 capped at 3.00 (was 3.2405–4.2218 in steps)
      { upTo: 400, rate: 4.1584 },
      { upTo: null, rate: 4.3583 },
    ],
  },
  /** >150 kWh/month. */
  large: {
    code: { MEA: '1.2', PEA: '1.1.2' },
    label: { th: 'ใช้เกิน 150 หน่วย/เดือน', en: 'Over 150 kWh/month' },
    serviceChargeBaht: 24.62,
    tiers: [
      { upTo: 200, rate: 3.0 }, // was 3.2484 (≤150) / 4.2218 (151–200)
      { upTo: 400, rate: 4.1584 },
      { upTo: null, rate: 4.3583 },
    ],
  },
};

/** Monthly units at or below this pick the small tariff in "auto" mode. */
export const SMALL_TARIFF_MAX_KWH = 150;

/** Typical wattages for the appliance quick-pick. Rough averages; check the label on yours. */
export const APPLIANCE_PRESETS = [
  { icon: '❄️', watts: 1000, hoursPerDay: 8, name: { th: 'แอร์ 12000 BTU', en: 'Air-con 12,000 BTU' } },
  { icon: '🧊', watts: 120, hoursPerDay: 24, name: { th: 'ตู้เย็น', en: 'Fridge' } },
  { icon: '🌀', watts: 50, hoursPerDay: 8, name: { th: 'พัดลม', en: 'Fan' } },
  { icon: '📺', watts: 100, hoursPerDay: 4, name: { th: 'ทีวี', en: 'TV' } },
  { icon: '🚿', watts: 3500, hoursPerDay: 0.5, name: { th: 'เครื่องทำน้ำอุ่น', en: 'Water heater' } },
  { icon: '💻', watts: 65, hoursPerDay: 8, name: { th: 'โน้ตบุ๊ก', en: 'Laptop' } },
] as const;
