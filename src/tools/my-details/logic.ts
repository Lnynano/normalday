import { z } from 'zod';

export const MAX_ENTRIES = 100;

export const detailEntry = z.object({
  id: z.string().min(1).max(64),
  label: z.string().max(60).describe('What this is, e.g. "Phone"'),
  value: z.string().max(2000),
  hidden: z.boolean().default(false).describe('Mask the value on screen until the user taps reveal'),
});

export const detailsInput = z.object({
  entries: z.array(detailEntry).max(MAX_ENTRIES),
  includeLabels: z.boolean().default(true).describe('Prefix each line with "label: "'),
});

export const detailsOutput = z.object({
  text: z.string().describe('Entries with a value, one per line, ready to paste'),
  count: z.number().int(),
});

export type DetailEntry = z.output<typeof detailEntry>;
export type DetailsInput = z.output<typeof detailsInput>;
export type DetailsOutput = z.output<typeof detailsOutput>;

/** Entries with a value, as plain text (multi-line values such as addresses keep their line breaks). */
export function formatDetails(input: DetailsInput): DetailsOutput {
  const filled = input.entries.filter((e) => e.value.trim() !== '');
  const lines = filled.map((e) => (input.includeLabels && e.label.trim() ? `${e.label.trim()}: ${e.value.trim()}` : e.value.trim()));
  return { text: lines.join('\n'), count: filled.length };
}

/** Bullets standing in for a hidden value. Capped so the real length isn't obvious. */
export function maskValue(value: string): string {
  const n = [...value.trim()].length;
  return n === 0 ? '' : '•'.repeat(Math.min(n, 12));
}

const backupFile = z
  .object({
    app: z.literal('normalday'),
    kind: z.literal('my-details'),
    version: z.literal(1),
    entries: z.array(detailEntry).max(MAX_ENTRIES),
  })
  .refine((b) => new Set(b.entries.map((e) => e.id)).size === b.entries.length, { message: 'duplicate ids' });

export function serializeBackup(entries: readonly DetailEntry[]): string {
  return JSON.stringify({ app: 'normalday', kind: 'my-details', version: 1, entries }, null, 2);
}

/** Entries from a backup string, or null if it isn't a valid Normalday My Details backup. */
export function parseBackup(text: string): DetailEntry[] | null {
  try {
    const result = backupFile.safeParse(JSON.parse(text));
    return result.success ? result.data.entries : null;
  } catch {
    return null;
  }
}
