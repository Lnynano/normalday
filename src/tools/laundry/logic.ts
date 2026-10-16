import { z } from 'zod';
import { LAUNDRY_ITEMS, LAUNDRY_MACHINES, type LaundryGroup, type LaundryItemId, type Temperature } from '../../data/laundry';

const count = (what: string) => z.number().int().min(0).max(999).default(0).describe(`Number of ${what}`);

export const laundryInput = z.object({
  shirt: count('shirts / t-shirts / tops'),
  jeans: count('jeans'),
  jogger: count('jogger pants'),
  shorts: count('short pants'),
  elephant: count('elephant pants'),
  underwear: count('underwear pieces'),
}) satisfies z.ZodType<Record<LaundryItemId, number>, unknown>;

const temperature = z.enum(['cold', 'warm', 'hot']);

export const laundryLoad = z.object({
  group: z.enum(['upper', 'lower']).describe('upper = shirts/tops, lower = pants & underwear; washed separately'),
  pieces: z.number().int(),
  weightKg: z.number().describe('Estimated dry weight'),
  machineKg: z.number().describe('Smallest machine that fits (largest machine if over capacity)'),
  temperature,
  priceBaht: z.number(),
  overCapacity: z.boolean().describe('True when the load exceeds the largest machine; split it into two washes'),
});

export const laundryOutput = z.object({
  loads: z.array(laundryLoad).describe('One entry per non-empty group'),
  totalBaht: z.number(),
});

export type LaundryInput = z.output<typeof laundryInput>;
export type LaundryLoad = z.output<typeof laundryLoad>;
export type LaundryOutput = z.output<typeof laundryOutput>;

const TEMP_ORDER: Temperature[] = ['cold', 'warm', 'hot'];
const hotter = (a: Temperature, b: Temperature) => (TEMP_ORDER.indexOf(b) > TEMP_ORDER.indexOf(a) ? b : a);

/** Smallest machine whose capacity fits `grams`; falls back to the largest. */
export function pickMachine(grams: number) {
  const fit = LAUNDRY_MACHINES.find((m) => grams <= m.kg * 1000);
  const largest = LAUNDRY_MACHINES[LAUNDRY_MACHINES.length - 1]!;
  return { machine: fit ?? largest, overCapacity: !fit };
}

function loadFor(group: LaundryGroup, input: LaundryInput): LaundryLoad | null {
  let grams = 0;
  let pieces = 0;
  let temp: Temperature = 'cold';
  for (const item of LAUNDRY_ITEMS) {
    if (item.group !== group) continue;
    const n = input[item.id];
    if (n <= 0) continue;
    grams += n * item.grams;
    pieces += n;
    temp = hotter(temp, item.temperature);
  }
  if (grams === 0) return null;
  const { machine, overCapacity } = pickMachine(grams);
  return {
    group,
    pieces,
    weightKg: grams / 1000,
    machineKg: machine.kg,
    temperature: temp,
    priceBaht: machine.price[temp],
    overCapacity,
  };
}

/** Upper and lower clothes are washed as separate loads, as in the original calculator. */
export function calculateLaundry(input: LaundryInput): LaundryOutput {
  const loads = (['upper', 'lower'] as const).map((g) => loadFor(g, input)).filter((l) => l !== null);
  return { loads, totalBaht: loads.reduce((sum, l) => sum + l.priceBaht, 0) };
}
