import { z } from 'zod';
import {
  FT_BAHT_PER_KWH,
  RATES_LAST_VERIFIED,
  SMALL_TARIFF_MAX_KWH,
  TARIFFS,
  type Provider,
  type TariffSize,
} from '../../data/electricity';
import { VAT_RATE } from '../../data/tax';
import { toBaht, toSatang } from '../../lib/money';

const provider = z
  .enum(['MEA', 'PEA'])
  .default('MEA')
  .describe('MEA = กฟน. (Bangkok, Nonthaburi, Samut Prakan); PEA = กฟภ. (rest of Thailand)');
const tariff = z
  .enum(['auto', 'small', 'large'])
  .default('auto')
  .describe('Residential tariff: small = ≤150 kWh/month (MEA 1.1 / PEA 1.1.1), large = >150 (MEA 1.2 / PEA 1.1.2), auto = pick by units');

export const electricityInput = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('bill').describe('Monthly bill from meter units'),
    units: z.number().min(0).max(100_000).describe('Electricity used this month, kWh (หน่วย)'),
    provider,
    tariff,
  }),
  z.object({
    mode: z.literal('appliance').describe('Cost of running one appliance'),
    watts: z.number().min(0).max(100_000).describe('Appliance power, W'),
    hoursPerDay: z.number().min(0).max(24),
    days: z.number().int().min(1).max(31).default(30),
    baseMonthlyUnits: z
      .number()
      .min(0)
      .max(100_000)
      .default(0)
      .describe('Household usage without this appliance, kWh/month. Cost is the extra on the bill, so tiers are priced correctly'),
    provider,
    tariff,
  }),
]);

const tierLine = z.object({
  fromKWh: z.number(),
  toKWh: z.number().nullable(),
  units: z.number(),
  rate: z.number().describe('฿ per kWh'),
  amountBaht: z.number(),
});

const tariffInfo = {
  provider: z.enum(['MEA', 'PEA']),
  tariffSize: z.enum(['small', 'large']),
  tariffCode: z.string(),
  ratesLastVerified: z.string(),
};

export const billOutput = z.object({
  mode: z.literal('bill'),
  ...tariffInfo,
  units: z.number(),
  tiers: z.array(tierLine),
  energyBaht: z.number().describe('ค่าพลังงานไฟฟ้า'),
  serviceChargeBaht: z.number().describe('ค่าบริการ'),
  ftRate: z.number().describe('Ft, ฿ per kWh'),
  ftBaht: z.number(),
  subtotalBaht: z.number().describe('Before VAT'),
  vatBaht: z.number(),
  totalBaht: z.number(),
  averagePerKWh: z.number().describe('totalBaht / units, 0 when units = 0'),
});

export const applianceOutput = z.object({
  mode: z.literal('appliance'),
  ...tariffInfo,
  kWh: z.number(),
  kWhPerDay: z.number(),
  costBaht: z.number().describe('Extra on the monthly bill incl. Ft and VAT'),
  costPerDayBaht: z.number(),
  effectiveRatePerKWh: z.number(),
});

export const electricityOutput = z.discriminatedUnion('mode', [billOutput, applianceOutput]);

export type ElectricityInput = z.output<typeof electricityInput>;
export type BillOutput = z.output<typeof billOutput>;
export type ApplianceOutput = z.output<typeof applianceOutput>;
export type ElectricityOutput = z.output<typeof electricityOutput>;

export function resolveTariff(choice: 'auto' | TariffSize, units: number): TariffSize {
  if (choice !== 'auto') return choice;
  return units <= SMALL_TARIFF_MAX_KWH ? 'small' : 'large';
}

const r2 = (n: number) => toBaht(toSatang(n));

/** Progressive energy charge split into tiers. */
export function tierBreakdown(units: number, size: TariffSize) {
  const lines: z.output<typeof tierLine>[] = [];
  let prev = 0;
  for (const tier of TARIFFS[size].tiers) {
    if (units <= prev) break;
    const top = tier.upTo ?? Infinity;
    const inTier = Math.min(units, top) - prev;
    lines.push({ fromKWh: prev + 1, toKWh: tier.upTo, units: r2(inTier), rate: tier.rate, amountBaht: inTier * tier.rate });
    prev = top;
  }
  return lines;
}

/**
 * Bill = (energy + service charge + Ft) × (1 + VAT).
 * Each line is rounded to satang like the printed bill.
 */
export function calculateBill(units: number, size: TariffSize, prov: Provider): BillOutput {
  const tariff = TARIFFS[size];
  const tiers = tierBreakdown(units, size);
  const energy = toSatang(tiers.reduce((s, l) => s + l.amountBaht, 0));
  const service = toSatang(tariff.serviceChargeBaht);
  const ft = toSatang(units * FT_BAHT_PER_KWH);
  const subtotal = energy + service + ft;
  const vat = toSatang(toBaht(subtotal) * VAT_RATE);
  const total = subtotal + vat;
  return {
    mode: 'bill',
    provider: prov,
    tariffSize: size,
    tariffCode: tariff.code[prov],
    ratesLastVerified: RATES_LAST_VERIFIED,
    units,
    tiers: tiers.map((l) => ({ ...l, amountBaht: r2(l.amountBaht) })),
    energyBaht: toBaht(energy),
    serviceChargeBaht: toBaht(service),
    ftRate: FT_BAHT_PER_KWH,
    ftBaht: toBaht(ft),
    subtotalBaht: toBaht(subtotal),
    vatBaht: toBaht(vat),
    totalBaht: toBaht(total),
    averagePerKWh: units > 0 ? r2(toBaht(total) / units) : 0,
  };
}

/**
 * Marginal cost: bill(base + appliance) − bill(base), on the tariff the
 * combined usage falls into. The service charge cancels out.
 */
export function calculateAppliance(input: Extract<ElectricityInput, { mode: 'appliance' }>): ApplianceOutput {
  const kWh = (input.watts * input.hoursPerDay * input.days) / 1000;
  const size = resolveTariff(input.tariff, input.baseMonthlyUnits + kWh);
  const withIt = calculateBill(input.baseMonthlyUnits + kWh, size, input.provider);
  const without = calculateBill(input.baseMonthlyUnits, size, input.provider);
  const cost = toSatang(withIt.totalBaht) - toSatang(without.totalBaht);
  return {
    mode: 'appliance',
    provider: input.provider,
    tariffSize: size,
    tariffCode: withIt.tariffCode,
    ratesLastVerified: RATES_LAST_VERIFIED,
    kWh: r2(kWh),
    kWhPerDay: r2(kWh / input.days),
    costBaht: toBaht(cost),
    costPerDayBaht: r2(toBaht(cost) / input.days),
    effectiveRatePerKWh: kWh > 0 ? r2(toBaht(cost) / kWh) : 0,
  };
}

export function calculateElectricity(input: ElectricityInput): ElectricityOutput {
  if (input.mode === 'appliance') return calculateAppliance(input);
  return calculateBill(input.units, resolveTariff(input.tariff, input.units), input.provider);
}
