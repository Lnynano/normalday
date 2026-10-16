import { describe, expect, it } from 'vitest';
import { allocate, formatBaht, round2, roundSatangToBaht, toSatang } from './money';

describe('money', () => {
  it('converts to satang without float drift', () => {
    expect(toSatang(0.1 + 0.2)).toBe(30);
    expect(toSatang(1.005)).toBe(101);
    expect(round2(2.675)).toBe(2.68);
  });

  it('rounds satang to whole baht', () => {
    expect(roundSatangToBaht(10001, 'up')).toBe(10100);
    expect(roundSatangToBaht(10049, 'nearest')).toBe(10000);
    expect(roundSatangToBaht(10050, 'nearest')).toBe(10100);
    expect(roundSatangToBaht(10049, 'none')).toBe(10049);
  });

  it('allocates exactly, remainder to earliest', () => {
    expect(allocate(100, [1, 1, 1])).toEqual([34, 33, 33]);
    expect(allocate(1000, [1, 3])).toEqual([250, 750]);
    expect(allocate(5, [0, 0])).toEqual([0, 0]);
    const parts = allocate(99999, [3, 7, 11, 13]);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(99999);
  });

  it('formats baht', () => {
    expect(formatBaht(1234)).toBe('1,234 ฿');
    expect(formatBaht(12.5)).toBe('12.50 ฿');
    expect(formatBaht(12, { decimals: 2 })).toBe('12.00 ฿');
  });
});
