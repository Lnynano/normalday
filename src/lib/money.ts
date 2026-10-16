/**
 * Money helpers. Do arithmetic in integer satang (1 ฿ = 100 satang) to avoid
 * float drift like 0.1 + 0.2, and convert back to baht only for output.
 */

export function toSatang(baht: number): number {
  // toFixed(6) absorbs float noise first, so 1.005 → 101, not 100
  return Math.round(Number((baht * 100).toFixed(6)));
}

export function toBaht(satang: number): number {
  return satang / 100;
}

/** Round a baht amount to 2 decimals (half away from zero). */
export function round2(baht: number): number {
  return toBaht(toSatang(baht));
}

export type RoundingMode = 'up' | 'nearest' | 'none';

/** Round satang to whole baht. */
export function roundSatangToBaht(satang: number, mode: RoundingMode): number {
  if (mode === 'none') return satang;
  if (mode === 'up') return Math.ceil(satang / 100) * 100;
  return Math.round(satang / 100) * 100;
}

/**
 * Split `total` satang into parts proportional to `weights` so the parts sum
 * exactly to `total` (largest-remainder method; ties go to earlier entries).
 */
export function allocate(total: number, weights: readonly number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  const raw = weights.map((w) => (total * w) / sum);
  const parts = raw.map(Math.floor);
  let left = total - parts.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);
  for (const { i } of order) {
    if (left <= 0) break;
    parts[i]! += 1;
    left -= 1;
  }
  return parts;
}

export function formatBaht(baht: number, opts: { decimals?: 0 | 2 } = {}): string {
  const decimals = opts.decimals ?? (Number.isInteger(baht) ? 0 : 2);
  return `${baht.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })} ฿`;
}
