import type { Localized } from '../tools/types';

/** App-level UI strings. Tool-specific strings live next to each tool's View. */
export const S = {
  tagline: { th: 'เครื่องมือเล็ก ๆ สำหรับทุกวัน', en: 'Little tools for every day' },
  searchPlaceholder: { th: 'ค้นหาเครื่องมือ… เช่น ค่าไฟ, laundry', en: 'Search tools… e.g. electric, ซักผ้า' },
  noResults: { th: 'ไม่พบเครื่องมือที่ตรงกับ', en: 'No tools match' },
  back: { th: 'หน้าแรก', en: 'Home' },
  notFound: { th: 'ไม่พบเครื่องมือนี้', en: 'Tool not found' },
  loading: { th: 'กำลังโหลด…', en: 'Loading…' },
  themeSystem: { th: 'ธีมตามระบบ', en: 'System theme' },
  themeLight: { th: 'ธีมสว่าง', en: 'Light theme' },
  themeDark: { th: 'ธีมมืด', en: 'Dark theme' },
  switchLang: { th: 'Switch to English', en: 'เปลี่ยนเป็นภาษาไทย' },
  reset: { th: 'ล้างค่า', en: 'Reset' },
  copy: { th: 'คัดลอกสรุป', en: 'Copy summary' },
  copied: { th: 'คัดลอกแล้ว ✓', en: 'Copied ✓' },
} satisfies Record<string, Localized>;
