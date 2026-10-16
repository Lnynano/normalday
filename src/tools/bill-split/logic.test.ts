import { describe, expect, it } from 'vitest';
import { billSplitInput, formatSummary, splitBill, type BillSplitInput } from './logic';

const run = (raw: unknown) => {
  const input: BillSplitInput = billSplitInput.parse(raw);
  return { input, out: splitBill(input) };
};

describe('bill split', () => {
  it('plain total, even split', () => {
    const { out } = run({ peopleCount: 4, items: [{ price: 1200 }] });
    expect(out.people.map((p) => p.payBaht)).toEqual([300, 300, 300, 300]);
    expect(out).toMatchObject({ totalBaht: 1200, collectedBaht: 1200, differenceBaht: 0 });
  });

  it('service 10% then VAT 7% on subtotal + service', () => {
    // 1000 + 100 = 1100; VAT 77 → 1177
    const { out } = run({ peopleCount: 2, items: [{ price: 1000 }], servicePercent: 10, addVat: true, rounding: 'none' });
    expect(out).toMatchObject({ subtotalBaht: 1000, serviceChargeBaht: 100, vatBaht: 77, totalBaht: 1177 });
    expect(out.people.map((p) => p.shareBaht)).toEqual([588.5, 588.5]);
  });

  it('rounds up and reports the extra', () => {
    const { out } = run({ peopleCount: 3, items: [{ price: 1000 }] });
    // 333.34 + 333.33 + 333.33 → 334 each
    expect(out.people.map((p) => p.payBaht)).toEqual([334, 334, 334]);
    expect(out.differenceBaht).toBe(2);
  });

  it('nearest rounding can be short; none is exact', () => {
    expect(run({ peopleCount: 3, items: [{ price: 1000 }], rounding: 'nearest' }).out.differenceBaht).toBe(-1);
    const exact = run({ peopleCount: 3, items: [{ price: 1000 }], rounding: 'none' }).out;
    expect(exact.people.map((p) => p.payBaht)).toEqual([333.34, 333.33, 333.33]);
    expect(exact.differenceBaht).toBe(0);
  });

  it('items shared by some people only', () => {
    // Beer 300 for persons 0+1, food 600 for everyone (3)
    const { out } = run({
      peopleCount: 3,
      items: [
        { name: 'Beer', price: 300, sharedBy: [0, 1] },
        { name: 'Food', price: 600 },
      ],
      servicePercent: 10,
      rounding: 'none',
    });
    expect(out.people.map((p) => p.subtotalBaht)).toEqual([350, 350, 200]);
    expect(out.people.map((p) => p.shareBaht)).toEqual([385, 385, 220]);
    expect(out.totalBaht).toBe(990);
  });

  it('person who shares nothing pays nothing', () => {
    const { out } = run({ peopleCount: 3, items: [{ price: 100, sharedBy: [0] }] });
    expect(out.people.map((p) => p.payBaht)).toEqual([100, 0, 0]);
  });

  it('shares always sum to the total', () => {
    const { out } = run({
      peopleCount: 7,
      items: [{ price: 123.45 }, { price: 67.89, sharedBy: [1, 3, 5] }, { price: 0.01, sharedBy: [6] }],
      servicePercent: 10,
      addVat: true,
      rounding: 'none',
    });
    const sum = out.people.reduce((s, p) => s + Math.round(p.shareBaht * 100), 0);
    expect(sum).toBe(Math.round(out.totalBaht * 100));
  });

  it('uses names, falling back to defaults', () => {
    const { out } = run({ peopleCount: 2, names: ['Ann', ' '], items: [{ price: 10 }] });
    expect(out.people.map((p) => p.name)).toEqual(['Ann', 'คนที่ 2']);
  });

  it('rejects sharedBy indexes outside peopleCount', () => {
    expect(billSplitInput.safeParse({ peopleCount: 2, items: [{ price: 10, sharedBy: [2] }] }).success).toBe(false);
    expect(billSplitInput.safeParse({ peopleCount: 0, items: [{ price: 10 }] }).success).toBe(false);
    expect(billSplitInput.safeParse({ peopleCount: 2, items: [] }).success).toBe(false);
  });

  it('formats a copyable summary', () => {
    const { input, out } = run({ peopleCount: 3, names: ['Ann'], items: [{ price: 1000 }], servicePercent: 10, addVat: true });
    expect(formatSummary(input, out, 'en')).toBe(
      [
        '🧾 Bill split',
        'Total 1,177 ฿ (Items 1,000 ฿ + Service 10% 100 ฿ + VAT 7% 77 ฿)',
        '• Ann: 393 ฿',
        '• Person 2: 393 ฿',
        '• Person 3: 393 ฿',
        'Extra collected +2 ฿',
      ].join('\n'),
    );
  });
});
