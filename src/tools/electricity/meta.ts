import { defineTool } from '../types';
import { calculateElectricity, electricityInput, electricityOutput } from './logic';

export const electricityMeta = defineTool({
  id: 'electricity',
  name: { th: 'ค่าไฟ', en: 'Electric Bill' },
  description: {
    th: 'คำนวณค่าไฟบ้านจากหน่วย (อัตราก้าวหน้า + Ft + VAT) หรือค่าไฟของเครื่องใช้ไฟฟ้า',
    en: 'Home electricity bill from kWh (progressive rate + Ft + VAT), or what one appliance costs',
  },
  keywords: ['electricity', 'electric', 'power', 'kwh', 'watt', 'ft', 'mea', 'pea', 'ไฟฟ้า', 'หน่วย', 'กฟน', 'กฟภ', 'วัตต์', 'แอร์'],
  icon: '⚡',
  inputSchema: electricityInput,
  outputSchema: electricityOutput,
  run: calculateElectricity,
  examples: [
    { description: '120 kWh month, auto tariff', input: { mode: 'bill', units: 120 } },
    { description: '350 kWh on PEA', input: { mode: 'bill', units: 350, provider: 'PEA' } },
    { description: 'air-con 8 h/day', input: { mode: 'appliance', watts: 1000, hoursPerDay: 8, baseMonthlyUnits: 150 } },
  ],
});
