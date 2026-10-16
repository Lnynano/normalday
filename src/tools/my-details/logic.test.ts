import { describe, expect, it } from 'vitest';
import { detailsInput, formatDetails, maskValue, parseBackup, serializeBackup, type DetailEntry } from './logic';

// Fake data only: the repo is public.
const entry = (id: string, label: string, value: string, hidden = false): DetailEntry => ({ id, label, value, hidden });

describe('formatDetails', () => {
  const entries = [entry('1', 'Name', 'Test User'), entry('2', 'Phone', ' 080-000-0000 '), entry('3', 'Empty', '  ')];

  it('labels each filled entry and skips empty ones', () => {
    expect(formatDetails({ entries, includeLabels: true })).toEqual({ text: 'Name: Test User\nPhone: 080-000-0000', count: 2 });
  });

  it('can omit labels, and ignores blank labels', () => {
    expect(formatDetails({ entries, includeLabels: false }).text).toBe('Test User\n080-000-0000');
    expect(formatDetails({ entries: [entry('1', ' ', 'x')], includeLabels: true }).text).toBe('x');
  });

  it('keeps line breaks inside a value', () => {
    expect(formatDetails({ entries: [entry('1', 'Address', '1 Test Rd\nBangkok')], includeLabels: true }).text).toBe(
      'Address: 1 Test Rd\nBangkok',
    );
  });

  it('is empty when nothing is filled in', () => {
    expect(formatDetails({ entries: [], includeLabels: true })).toEqual({ text: '', count: 0 });
  });

  it('applies schema defaults', () => {
    const parsed = detailsInput.parse({ entries: [{ id: 'a', label: 'x', value: 'y' }] });
    expect(parsed.includeLabels).toBe(true);
    expect(parsed.entries[0]?.hidden).toBe(false);
  });
});

describe('maskValue', () => {
  it('masks, caps the length, and leaves empty values empty', () => {
    expect(maskValue('1234')).toBe('••••');
    expect(maskValue('1234567890123456')).toBe('•'.repeat(12));
    expect(maskValue('   ')).toBe('');
  });
});

describe('backup', () => {
  const entries = [entry('1', 'Name', 'Test User'), entry('2', 'National ID', '0000000000000', true)];

  it('round-trips', () => {
    expect(parseBackup(serializeBackup(entries))).toEqual(entries);
  });

  it('rejects garbage, other files and duplicate ids', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{}')).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'normalday', kind: 'other', version: 1, entries: [] }))).toBeNull();
    expect(parseBackup(JSON.stringify({ app: 'normalday', kind: 'my-details', version: 2, entries: [] }))).toBeNull();
    expect(parseBackup(serializeBackup([entry('1', 'a', 'b'), entry('1', 'c', 'd')]))).toBeNull();
  });
});
