/**
 * Quick-add labels for the My Details tool. Labels only: NEVER put real
 * personal values here, because this repo and site are public. Users type
 * their own values into the app; they stay in that browser's localStorage.
 */
export const DETAIL_PRESETS = [
  { label: { th: 'ชื่อ-นามสกุล (ไทย)', en: 'Full name (Thai)' }, hidden: false },
  { label: { th: 'ชื่อ-นามสกุล (อังกฤษ)', en: 'Full name (English)' }, hidden: false },
  { label: { th: 'เบอร์โทร', en: 'Phone' }, hidden: false },
  { label: { th: 'อีเมล', en: 'Email' }, hidden: false },
  { label: { th: 'LINE ID', en: 'LINE ID' }, hidden: false },
  { label: { th: 'ที่อยู่ (ไทย)', en: 'Address (Thai)' }, hidden: false },
  { label: { th: 'ที่อยู่ (อังกฤษ)', en: 'Address (English)' }, hidden: false },
  { label: { th: 'รหัสนักศึกษา', en: 'Student ID' }, hidden: false },
  { label: { th: 'วันเกิด', en: 'Date of birth' }, hidden: false },
  { label: { th: 'เลขบัตรประชาชน', en: 'National ID' }, hidden: true },
  { label: { th: 'เลขบัญชี / พร้อมเพย์', en: 'Bank account / PromptPay' }, hidden: true },
] as const satisfies readonly { label: { th: string; en: string }; hidden: boolean }[];
