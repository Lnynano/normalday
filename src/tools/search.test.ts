import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { searchTools } from './search';
import { defineTool } from './types';

const fake = (id: string, th: string, en: string, keywords: string[], desc = '') =>
  defineTool({
    id,
    name: { th, en },
    description: { th: desc, en: desc },
    keywords,
    icon: '•',
    inputSchema: z.object({}),
    outputSchema: z.object({}),
    run: () => ({}),
    examples: [],
  });

const list = [
  fake('laundry', 'ซักผ้าหยอดเหรียญ', 'Coin Laundry', ['washing machine', 'เครื่องซักผ้า']),
  fake('electricity', 'ค่าไฟ', 'Electric Bill', ['kwh', 'หน่วย', 'mea', 'pea']),
  fake('bill-split', 'หารบิล', 'Bill Split', ['vat', 'service charge'], 'Split a restaurant bill'),
];
const ids = (q: string) => searchTools(list, q).map((t) => t.id);

describe('searchTools', () => {
  it('returns all tools for an empty query', () => {
    expect(ids('  ')).toEqual(['laundry', 'electricity', 'bill-split']);
  });

  it('matches Thai and English names, case-insensitive', () => {
    expect(ids('ค่าไฟ')).toEqual(['electricity']);
    expect(ids('LAUNDRY')).toEqual(['laundry']);
    expect(ids('ซักผ้า')).toEqual(['laundry']);
  });

  it('matches keywords and descriptions', () => {
    expect(ids('kwh')).toEqual(['electricity']);
    expect(ids('restaurant')).toEqual(['bill-split']);
  });

  it('ranks name matches above keyword matches', () => {
    // "bill" is in the electricity name and the bill-split name; prefix wins
    expect(ids('bill')).toEqual(['bill-split', 'electricity']);
  });

  it('requires every term to match', () => {
    expect(ids('bill vat')).toEqual(['bill-split']);
    expect(ids('laundry kwh')).toEqual([]);
  });
});
