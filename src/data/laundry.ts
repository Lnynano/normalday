/**
 * Coin-laundry data, taken from the original laundry-calculator.html.
 * Edit here when the shop changes prices or you re-weigh clothes.
 */

export type Temperature = 'cold' | 'warm' | 'hot';
export type LaundryGroup = 'upper' | 'lower';

export const LAUNDRY_ITEMS = [
  { id: 'shirt', group: 'upper', grams: 250, temperature: 'cold', name: { th: 'เสื้อ / เสื้อยืด', en: 'Shirt / T-shirt / Top' } },
  { id: 'jeans', group: 'lower', grams: 650, temperature: 'warm', name: { th: 'กางเกงยีนส์', en: 'Jeans' } },
  { id: 'jogger', group: 'lower', grams: 400, temperature: 'cold', name: { th: 'กางเกงวอร์ม', en: 'Jogger pants' } },
  { id: 'shorts', group: 'lower', grams: 270, temperature: 'cold', name: { th: 'กางเกงขาสั้น', en: 'Short pants' } },
  { id: 'elephant', group: 'lower', grams: 220, temperature: 'cold', name: { th: 'กางเกงช้าง', en: 'Elephant pants' } },
  { id: 'underwear', group: 'lower', grams: 70, temperature: 'cold', name: { th: 'ชุดชั้นใน', en: 'Underwear' } },
] as const satisfies readonly {
  id: string;
  group: LaundryGroup;
  /** Approximate dry weight of one piece. */
  grams: number;
  /** Lowest wash temperature this item needs; a load uses the hottest item's temperature. */
  temperature: Temperature;
  name: { th: string; en: string };
}[];

export type LaundryItemId = (typeof LAUNDRY_ITEMS)[number]['id'];

/** Machines, smallest first. Price in ฿ per wash by temperature. */
export const LAUNDRY_MACHINES = [
  { kg: 9.5, price: { cold: 40, warm: 50, hot: 60 } },
  { kg: 14, price: { cold: 60, warm: 70, hot: 80 } },
  { kg: 18, price: { cold: 80, warm: 100, hot: 120 } },
] as const satisfies readonly { kg: number; price: Record<Temperature, number> }[];

export const LAUNDRY_GROUPS = {
  upper: { icon: '👕', name: { th: 'ส่วนบน — เสื้อ', en: 'Upper — shirts & tops' } },
  lower: { icon: '👖', name: { th: 'ส่วนล่าง — กางเกง & ชุดชั้นใน', en: 'Lower — pants & underwear' } },
} as const satisfies Record<LaundryGroup, { icon: string; name: { th: string; en: string } }>;
