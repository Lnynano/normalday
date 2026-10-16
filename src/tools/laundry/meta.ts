import { defineTool } from '../types';
import { calculateLaundry, laundryInput, laundryOutput } from './logic';

export const laundryMeta = defineTool({
  id: 'laundry',
  name: { th: 'ซักผ้าหยอดเหรียญ', en: 'Coin Laundry' },
  description: {
    th: 'นับจำนวนเสื้อผ้า → ขนาดเครื่อง อุณหภูมิน้ำ และราคา',
    en: 'Count your clothes → machine size, water temperature and price',
  },
  keywords: ['laundry', 'washing machine', 'coin', 'wash', 'ซักผ้า', 'เครื่องซักผ้า', 'หยอดเหรียญ', 'ร้านซักผ้า', 'kg'],
  icon: '🧺',
  inputSchema: laundryInput,
  outputSchema: laundryOutput,
  run: calculateLaundry,
  examples: [
    { description: '10 shirts', input: { shirt: 10 } },
    { description: 'shirts plus jeans and underwear', input: { shirt: 12, jeans: 3, underwear: 7 } },
    { description: 'over capacity', input: { shirt: 80 } },
  ],
});
