import { defineTool } from '../types';
import { detailsInput, detailsOutput, formatDetails } from './logic';

export const myDetailsMeta = defineTool({
  id: 'my-details',
  name: { th: 'ข้อมูลของฉัน', en: 'My Details' },
  description: {
    th: 'เก็บชื่อ ที่อยู่ เบอร์โทร ฯลฯ ไว้ในเครื่อง แตะเพื่อคัดลอกไปวาง',
    en: 'Keep your name, address, phone etc. on this device and tap to copy',
  },
  keywords: ['details', 'profile', 'copy', 'paste', 'autofill', 'name', 'address', 'phone', 'ชื่อ', 'ที่อยู่', 'เบอร์', 'คัดลอก', 'ข้อมูลส่วนตัว'],
  icon: '🪪',
  inputSchema: detailsInput,
  outputSchema: detailsOutput,
  run: formatDetails,
  // Real values only ever live in the user's browser, so there is nothing for an AI to call.
  aiVisible: false,
  examples: [
    { description: 'two fake entries', input: { entries: [{ id: 'a', label: 'Name', value: 'Test User' }, { id: 'b', label: 'Phone', value: '080-000-0000' }] } },
  ],
});
