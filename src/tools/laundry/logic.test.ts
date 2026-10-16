import { describe, expect, it } from 'vitest';
import { calculateLaundry, laundryInput, pickMachine } from './logic';

const calc = (counts: Partial<Record<string, number>>) => calculateLaundry(laundryInput.parse(counts));

describe('laundry', () => {
  it('returns no loads when empty', () => {
    expect(calc({})).toEqual({ loads: [], totalBaht: 0 });
  });

  it('upper: shirts wash cold in the 9.5 kg machine', () => {
    // 10 × 250 g = 2.5 kg
    expect(calc({ shirt: 10 }).loads).toEqual([
      { group: 'upper', pieces: 10, weightKg: 2.5, machineKg: 9.5, temperature: 'cold', priceBaht: 40, overCapacity: false },
    ]);
  });

  it('machine thresholds are inclusive (38 shirts = 9.5 kg exactly)', () => {
    expect(calc({ shirt: 38 }).loads[0]).toMatchObject({ weightKg: 9.5, machineKg: 9.5 });
    expect(calc({ shirt: 39 }).loads[0]).toMatchObject({ machineKg: 14, priceBaht: 60 });
    expect(calc({ shirt: 56 }).loads[0]).toMatchObject({ weightKg: 14, machineKg: 14 });
    expect(calc({ shirt: 72 }).loads[0]).toMatchObject({ weightKg: 18, machineKg: 18, priceBaht: 80 });
  });

  it('over 18 kg flags a split load and uses 18 kg pricing (as the original)', () => {
    expect(calc({ shirt: 73 }).loads[0]).toMatchObject({ machineKg: 18, overCapacity: true, priceBaht: 80 });
  });

  it('lower: any jeans makes the load warm', () => {
    expect(calc({ shorts: 3, underwear: 5 }).loads[0]).toMatchObject({ temperature: 'cold', priceBaht: 40 });
    expect(calc({ jeans: 1, underwear: 5 }).loads[0]).toMatchObject({ temperature: 'warm', priceBaht: 50 });
  });

  it('sums lower weights without float drift', () => {
    // 2×650 + 1×400 + 3×270 + 2×220 + 7×70 = 3440 g
    const load = calc({ jeans: 2, jogger: 1, shorts: 3, elephant: 2, underwear: 7 }).loads[0]!;
    expect(load.weightKg).toBe(3.44);
    expect(load.pieces).toBe(15);
  });

  it('upper and lower are separate loads, total adds both', () => {
    const r = calc({ shirt: 40, jeans: 16 }); // 10 kg cold, 10.4 kg warm
    expect(r.loads.map((l) => [l.group, l.machineKg, l.priceBaht])).toEqual([
      ['upper', 14, 60],
      ['lower', 14, 70],
    ]);
    expect(r.totalBaht).toBe(130);
  });

  it('pickMachine', () => {
    expect(pickMachine(1).machine.kg).toBe(9.5);
    expect(pickMachine(18001).overCapacity).toBe(true);
  });

  it('rejects negative or fractional counts', () => {
    expect(laundryInput.safeParse({ shirt: -1 }).success).toBe(false);
    expect(laundryInput.safeParse({ shirt: 1.5 }).success).toBe(false);
  });
});
