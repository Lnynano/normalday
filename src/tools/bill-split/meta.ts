import { defineTool } from '../types';
import { billSplitInput, billSplitOutput, splitBill } from './logic';

export const billSplitMeta = defineTool({
  id: 'bill-split',
  name: { th: 'หารบิล', en: 'Bill Split' },
  description: {
    th: 'หารค่าอาหารตามรายการหรือยอดรวม พร้อม service charge, VAT 7% และปัดเศษ',
    en: 'Split a bill by items or total, with service charge, VAT 7% and rounding',
  },
  keywords: ['bill', 'split', 'restaurant', 'share', 'vat', 'service charge', 'หาร', 'บิล', 'ค่าอาหาร', 'แชร์', 'ร้านอาหาร'],
  icon: '🧾',
  inputSchema: billSplitInput,
  outputSchema: billSplitOutput,
  run: splitBill,
  examples: [
    { description: '1,200 ฿ between 4', input: { peopleCount: 4, items: [{ price: 1200 }] } },
    {
      description: 'items, beer for 2 of 3, service 10% + VAT',
      input: {
        peopleCount: 3,
        names: ['Ann', 'Bob', 'Cat'],
        items: [
          { name: 'Beer', price: 300, sharedBy: [0, 1] },
          { name: 'Food', price: 850 },
        ],
        servicePercent: 10,
        addVat: true,
      },
    },
  ],
});
