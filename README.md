# Normalday

เครื่องมือเล็ก ๆ สำหรับชีวิตประจำวันในไทย — เครื่องคิดเลขและข้อมูลอ้างอิงในแอปเดียว ใช้ออฟไลน์ได้ ติดตั้งเป็นแอปบนมือถือได้ (PWA)

Little everyday tools for life in Thailand: calculators and quick references in one installable, offline-capable web app.

**Live:** https://lnynano.github.io/normalday/

| Tool | ไทย | What it does |
| --- | --- | --- |
| 🧺 Coin Laundry | ซักผ้าหยอดเหรียญ | Clothing counts → machine size (9.5 / 14 / 18 kg), water temperature, price |
| ⚡ Electric Bill | ค่าไฟ | kWh → bill (progressive tiers + service + Ft + VAT, MEA/PEA), or appliance W × h × days → kWh and ฿ |
| 🧾 Bill Split | หารบิล | Total or items (optionally shared by some people), service %, VAT 7%, per-person rounding, copy summary |
| 🪪 My Details | ข้อมูลของฉัน | Your name, address, phone etc. saved on the device; tap to copy, mask sensitive ones, backup/restore |

Stack: Vite · React · TypeScript (strict) · Tailwind CSS 4 · Zod · vite-plugin-pwa · Vitest · GitHub Pages.

---

## วิธีรัน / Run locally

ต้องใช้ Node.js 22 ขึ้นไป / Requires Node.js 22+.

```bash
npm install
npm run dev        # http://localhost:5173/normalday/
npm test           # unit tests (Vitest)
npm run lint       # ESLint
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/ locally (to test the PWA / offline)
```

---

## โครงสร้าง / Architecture

```
src/
  tools/
    types.ts          ToolMeta: id, name/description {th,en}, keywords, icon,
                      inputSchema/outputSchema (Zod), run(), examples
    registry.ts       list of all tools + callTool() + toToolDefinitions() (JSON Schema)
    views.ts          tool id → lazy-loaded View (kept out of registry so it stays React-free)
    search.ts         TH/EN search over names, keywords, descriptions
    <id>/
      logic.ts        PURE functions + Zod schemas (no React, no DOM)
      logic.test.ts   Vitest tests
      View.tsx        UI; only calls logic.ts
      meta.ts         defineTool({...}) — wires schemas + run + examples
  data/               editable numbers: prices, rates, VAT (never hard-coded in logic)
  lib/                money (integer satang), safe localStorage, theme, usePersistentState
  i18n/               TH/EN context + app strings
  components/         shared UI (Card, Stepper, NumberInput, Segmented, Receipt…)
  pages/              Home (search + tiles), ToolPage
```

**ทำไมถึงแยกแบบนี้ / Why:** ทุกเครื่องมือคือฟังก์ชันบริสุทธิ์ที่มี schema ชัดเจน ในอนาคตผู้ช่วย AI จะอ่าน `registry.ts` เลือกเครื่องมือ แล้วเรียก `callTool(id, input)` ได้เลย โดยไม่ต้องผ่าน UI

Every tool is a pure function with a Zod schema. A future AI assistant can read
`toToolDefinitions()` (JSON Schema in the usual LLM tool-calling shape), pick a
tool and run `callTool(id, input)`. The input is validated before it runs. The
registry test runs every `examples` entry and checks the output against
`outputSchema`, so the schemas stay accurate.

A tool can set `aiVisible: false` in its meta to stay out of `toToolDefinitions()` (My Details does:
its real data only exists in the user's browser).

**Privacy:** this repo and the site are public. Never commit personal data. My Details ships with
headings only (`src/data/details.ts`); the values are typed in by the user and kept in that browser's `localStorage`.

Last inputs are saved per tool in `localStorage` under `normalday:v1:<id>`.
Saved data is validated on load, so a changed shape just falls back to the defaults.

---

## เพิ่มเครื่องมือใหม่ / Add a new tool

ตัวอย่าง: เครื่องมือ `tip` / Example: a `tip` tool.

1. **สร้างโฟลเดอร์ / Create the folder** `src/tools/tip/`.
2. **`logic.ts`**: Zod schemas plus pure functions. Use `.describe()` on fields; the AI reads those descriptions.
   ```ts
   import { z } from 'zod';
   export const tipInput = z.object({
     amount: z.number().min(0).describe('Bill amount in ฿'),
     percent: z.number().min(0).max(100).default(10),
   });
   export const tipOutput = z.object({ tipBaht: z.number(), totalBaht: z.number() });
   export function calculateTip(i: z.output<typeof tipInput>): z.output<typeof tipOutput> {
     const tipBaht = Math.round(i.amount * i.percent) / 100;
     return { tipBaht, totalBaht: i.amount + tipBaht };
   }
   ```
   ถ้ามีตัวเลขที่เปลี่ยนได้ (ราคา อัตรา) ให้ใส่ใน `src/data/tip.ts`. Put any changeable numbers (prices, rates) in `src/data/tip.ts`.
3. **`logic.test.ts`**: test the pure functions with Vitest.
4. **`meta.ts`**
   ```ts
   import { defineTool } from '../types';
   import { calculateTip, tipInput, tipOutput } from './logic';
   export const tipMeta = defineTool({
     id: 'tip',
     name: { th: 'คำนวณทิป', en: 'Tip' },
     description: { th: '…', en: '…' },
     keywords: ['tip', 'ทิป'],
     icon: '💁',
     inputSchema: tipInput,
     outputSchema: tipOutput,
     run: calculateTip,
     examples: [{ description: '10% of 500', input: { amount: 500 } }],
   });
   ```
5. **`View.tsx`**: a default-exported component. Use `usePersistentState('tip', schema, defaults)` to remember inputs, `useLang().t({ th, en })` for text, and the parts in `src/components/ui.tsx`.
6. **Register it:** add `tipMeta` to `tools` in `src/tools/registry.ts`, and `tip: lazy(() => import('./tip/View'))` in `src/tools/views.ts`.
7. Run `npm test`. The registry test checks unique ids, TH/EN text, a matching View, and that every example validates.

---

## เปิดใช้ GitHub Pages / Enable GitHub Pages

1. Push to GitHub. The repo name must match `BASE` in `vite.config.ts` (`/normalday/`).
2. GitHub repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main` (or run the workflow from the **Actions** tab). `.github/workflows/deploy.yml` lints, tests, builds and deploys.
4. เปิด / Open `https://<username>.github.io/normalday/`. บนมือถือกด "เพิ่มไปยังหน้าจอโฮม" / On a phone, use "Add to Home Screen" to install it.

ใช้ HashRouter (`#/t/laundry`) จึงไม่เจอ 404 บน Pages. Routes use HashRouter (`#/t/laundry`), so deep links don't 404 on Pages.

ถ้าเปลี่ยนชื่อ repo ให้แก้ `BASE` ใน `vite.config.ts`. If you rename the repo, update `BASE` in `vite.config.ts`.

---

## อัปเดตข้อมูล / Keeping data current

- **ค่าไฟ / Electricity:** `src/data/electricity.ts`. **Ft เปลี่ยนทุก 4 เดือน / Ft changes every 4 months** (Jan–Apr, May–Aug, Sep–Dec). Update `FT_BAHT_PER_KWH`, `FT_PERIOD`, `RATES_LAST_VERIFIED`, and the tiers if they changed. Then update the expected numbers in `src/tools/electricity/logic.test.ts`. Sources: [ERC Ft](https://www.erc.or.th/th/automatic/), MEA/PEA tariff pages.
- **ซักผ้า / Laundry:** `src/data/laundry.ts` (item weights, machine prices, which items need warm water).
- **VAT:** `src/data/tax.ts`.
