import { describe, expect, it } from 'vitest';
import { calculateBill, calculateElectricity, electricityInput, resolveTariff, tierBreakdown } from './logic';

// Expected values worked by hand from src/data/electricity.ts (Ft 0.1623, VAT 7%).
// If you update the rates, update these numbers too.
describe('electricity bill', () => {
  it('small tariff, 100 kWh', () => {
    // energy 15×2.3488 + 10×2.9882 + 75×3 = 290.114 → 290.11
    const b = calculateBill(100, 'small', 'MEA');
    expect(b).toMatchObject({
      tariffCode: '1.1',
      energyBaht: 290.11,
      serviceChargeBaht: 8.19,
      ftBaht: 16.23,
      subtotalBaht: 314.53,
      vatBaht: 22.02,
      totalBaht: 336.55,
    });
    expect(b.tiers.map((t) => t.units)).toEqual([15, 10, 75]);
  });

  it('large tariff, 300 kWh', () => {
    // 200×3 + 100×4.1584 = 1015.84; Ft 48.69; +24.62 = 1089.15; VAT 76.24
    expect(calculateBill(300, 'large', 'PEA')).toMatchObject({
      tariffCode: '1.1.2',
      energyBaht: 1015.84,
      ftBaht: 48.69,
      subtotalBaht: 1089.15,
      vatBaht: 76.24,
      totalBaht: 1165.39,
    });
  });

  it('large tariff, 500 kWh hits the top tier', () => {
    // 600 + 831.68 + 435.83 = 1867.51; Ft 81.15; +24.62 = 1973.28; VAT 138.13
    expect(calculateBill(500, 'large', 'MEA')).toMatchObject({ energyBaht: 1867.51, totalBaht: 2111.41 });
  });

  it('0 kWh still pays the service charge + VAT', () => {
    expect(calculateBill(0, 'small', 'MEA')).toMatchObject({ energyBaht: 0, totalBaht: 8.76, averagePerKWh: 0 });
  });

  it('tiers cover every unit exactly once', () => {
    const lines = tierBreakdown(437, 'small');
    expect(lines.reduce((s, l) => s + l.units, 0)).toBe(437);
    expect(lines.at(-1)).toMatchObject({ fromKWh: 401, toKWh: null, units: 37 });
  });

  it('auto tariff switches above 150 kWh', () => {
    expect(resolveTariff('auto', 150)).toBe('small');
    expect(resolveTariff('auto', 150.5)).toBe('large');
    expect(resolveTariff('small', 999)).toBe('small');
    const out = calculateElectricity(electricityInput.parse({ mode: 'bill', units: 151 }));
    expect(out).toMatchObject({ tariffSize: 'large', provider: 'MEA', tariffCode: '1.2' });
  });
});

describe('electricity appliance', () => {
  it('1000 W × 8 h × 30 days, nothing else', () => {
    // 240 kWh → large. bill(240) = 888.00, bill(0) = 26.34 → 861.66
    const r = calculateElectricity(electricityInput.parse({ mode: 'appliance', watts: 1000, hoursPerDay: 8 }));
    expect(r).toMatchObject({ mode: 'appliance', kWh: 240, kWhPerDay: 8, costBaht: 861.66, costPerDayBaht: 28.72, tariffSize: 'large' });
  });

  it('marginal cost is higher when the household already uses a lot', () => {
    const cost = (base: number) => {
      const r = calculateElectricity(
        electricityInput.parse({ mode: 'appliance', watts: 100, hoursPerDay: 10, days: 30, baseMonthlyUnits: base }),
      );
      return r.mode === 'appliance' ? r.effectiveRatePerKWh : NaN;
    };
    expect(cost(500)).toBeGreaterThan(cost(0));
  });

  it('0 hours costs nothing', () => {
    const r = calculateElectricity(electricityInput.parse({ mode: 'appliance', watts: 500, hoursPerDay: 0, baseMonthlyUnits: 200 }));
    expect(r).toMatchObject({ kWh: 0, costBaht: 0, effectiveRatePerKWh: 0 });
  });

  it('validates input', () => {
    expect(electricityInput.safeParse({ mode: 'bill', units: -1 }).success).toBe(false);
    expect(electricityInput.safeParse({ mode: 'appliance', watts: -5, hoursPerDay: 1 }).success).toBe(false);
    expect(electricityInput.safeParse({ mode: 'appliance', watts: 10, hoursPerDay: 25 }).success).toBe(false);
  });
});
