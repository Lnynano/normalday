import { z } from 'zod';
import { VAT_RATE } from '../../data/tax';
import { allocate, formatBaht, roundSatangToBaht, toBaht, toSatang } from '../../lib/money';
import type { Lang } from '../types';

export const billItem = z.object({
  name: z.string().max(60).default(''),
  price: z.number().min(0).max(10_000_000).describe('Item price in ฿, before service charge and VAT'),
  sharedBy: z
    .array(z.number().int().min(0))
    .default([])
    .describe('0-based indexes of the people sharing this item. Empty = everyone'),
});

export const billSplitInput = z
  .object({
    peopleCount: z.number().int().min(1).max(50),
    names: z.array(z.string().max(30)).max(50).default([]).describe('Optional display names, by person index'),
    items: z.array(billItem).min(1).describe('For a plain total, pass one item with the total as price'),
    servicePercent: z.number().min(0).max(100).default(0).describe('Service charge %, e.g. 10'),
    addVat: z.boolean().default(false).describe('Add VAT 7% on (subtotal + service). False if prices already include VAT'),
    rounding: z
      .enum(['up', 'nearest', 'none'])
      .default('up')
      .describe('Round each person to whole baht: up (payer never short), nearest, or none (exact satang)'),
  })
  .superRefine((v, ctx) => {
    v.items.forEach((item, i) =>
      item.sharedBy.forEach((p, j) => {
        if (p >= v.peopleCount)
          ctx.addIssue({ code: 'custom', path: ['items', i, 'sharedBy', j], message: `person index ${p} ≥ peopleCount` });
      }),
    );
  });

const person = z.object({
  index: z.number().int(),
  name: z.string(),
  subtotalBaht: z.number().describe('Their share of item prices'),
  shareBaht: z.number().describe('Exact share incl. service and VAT; all shares sum to totalBaht'),
  payBaht: z.number().describe('Amount to pay after rounding'),
});

export const billSplitOutput = z.object({
  people: z.array(person),
  subtotalBaht: z.number(),
  serviceChargeBaht: z.number(),
  vatBaht: z.number(),
  totalBaht: z.number(),
  collectedBaht: z.number().describe('Sum of payBaht'),
  differenceBaht: z.number().describe('collected − total: positive = extra collected, negative = short'),
});

export type BillSplitInput = z.output<typeof billSplitInput>;
export type BillSplitOutput = z.output<typeof billSplitOutput>;

export function defaultName(index: number, lang: Lang = 'th'): string {
  return lang === 'th' ? `คนที่ ${index + 1}` : `Person ${index + 1}`;
}

/**
 * Service charge first, then VAT on (subtotal + service), as Thai restaurants
 * print it. Shared items are split evenly between their sharers; leftover
 * satang go to the earliest people so nothing is lost.
 */
export function splitBill(input: BillSplitInput): BillSplitOutput {
  const n = input.peopleCount;
  const everyone = Array.from({ length: n }, (_, i) => i);
  const sub = new Array<number>(n).fill(0);

  for (const item of input.items) {
    const sharers = item.sharedBy.length ? [...new Set(item.sharedBy)] : everyone;
    allocate(toSatang(item.price), sharers.map(() => 1)).forEach((part, k) => {
      sub[sharers[k]!]! += part;
    });
  }

  const subtotal = sub.reduce((a, b) => a + b, 0);
  const service = toSatang((toBaht(subtotal) * input.servicePercent) / 100);
  const vat = input.addVat ? toSatang(toBaht(subtotal + service) * VAT_RATE) : 0;
  const total = subtotal + service + vat;

  const shares = allocate(total, sub);
  const pays = shares.map((s) => roundSatangToBaht(s, input.rounding));
  const collected = pays.reduce((a, b) => a + b, 0);

  return {
    people: everyone.map((i) => ({
      index: i,
      name: input.names[i]?.trim() || defaultName(i),
      subtotalBaht: toBaht(sub[i]!),
      shareBaht: toBaht(shares[i]!),
      payBaht: toBaht(pays[i]!),
    })),
    subtotalBaht: toBaht(subtotal),
    serviceChargeBaht: toBaht(service),
    vatBaht: toBaht(vat),
    totalBaht: toBaht(total),
    collectedBaht: toBaht(collected),
    differenceBaht: toBaht(collected - total),
  };
}

const T = {
  title: { th: '🧾 หารบิล', en: '🧾 Bill split' },
  total: { th: 'ยอดรวม', en: 'Total' },
  food: { th: 'ค่าอาหาร', en: 'Items' },
  service: { th: 'ค่าบริการ', en: 'Service' },
  extra: { th: 'เก็บเกิน', en: 'Extra collected' },
  short: { th: 'ขาดอีก', en: 'Short by' },
};

/** Plain-text summary for copying into LINE/chat. */
export function formatSummary(input: BillSplitInput, out: BillSplitOutput, lang: Lang): string {
  const parts = [`${T.food[lang]} ${formatBaht(out.subtotalBaht)}`];
  if (out.serviceChargeBaht) parts.push(`${T.service[lang]} ${input.servicePercent}% ${formatBaht(out.serviceChargeBaht)}`);
  if (out.vatBaht) parts.push(`VAT 7% ${formatBaht(out.vatBaht)}`);
  const lines = [
    T.title[lang],
    `${T.total[lang]} ${formatBaht(out.totalBaht)}${parts.length > 1 ? ` (${parts.join(' + ')})` : ''}`,
    ...out.people.map((p) => {
      const name = input.names[p.index]?.trim() || defaultName(p.index, lang);
      return `• ${name}: ${formatBaht(p.payBaht)}`;
    }),
  ];
  if (out.differenceBaht > 0) lines.push(`${T.extra[lang]} +${formatBaht(out.differenceBaht)}`);
  if (out.differenceBaht < 0) lines.push(`${T.short[lang]} ${formatBaht(-out.differenceBaht)}`);
  return lines.join('\n');
}
