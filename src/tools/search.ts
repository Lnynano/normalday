import type { ToolMeta } from './types';

function norm(s: string): string {
  return s.toLowerCase().normalize('NFC').trim();
}

function score(tool: ToolMeta, q: string): number {
  const names = [tool.name.th, tool.name.en].map(norm);
  if (names.some((n) => n.startsWith(q))) return 4;
  if (names.some((n) => n.includes(q))) return 3;
  if (tool.keywords.some((k) => norm(k).includes(q))) return 2;
  if ([tool.description.th, tool.description.en].some((d) => norm(d).includes(q))) return 1;
  return 0;
}

/**
 * Filter + rank tools by a free-text query. Matches Thai and English names,
 * keywords and descriptions. Thai has no word spaces, so matching is substring
 * based; every space-separated term must match somewhere.
 */
export function searchTools<T extends ToolMeta>(tools: readonly T[], query: string): T[] {
  const terms = norm(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [...tools];
  return tools
    .map((tool) => {
      const scores = terms.map((t) => score(tool, t));
      return { tool, total: scores.every((s) => s > 0) ? scores.reduce((a, b) => a + b, 0) : 0 };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total)
    .map((r) => r.tool);
}
