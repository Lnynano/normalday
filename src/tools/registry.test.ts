import { describe, expect, it } from 'vitest';
import { callTool, toToolDefinitions, tools } from './registry';
import { toolViews } from './views';

describe('registry', () => {
  it('has unique kebab-case ids, each with a View', () => {
    const ids = tools.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(toolViews[id], `missing View for ${id}`).toBeDefined();
    }
    expect(Object.keys(toolViews).sort()).toEqual([...ids].sort());
  });

  it('has bilingual names/descriptions and keywords', () => {
    for (const t of tools) {
      for (const field of [t.name, t.description]) {
        expect(field.th.trim()).not.toBe('');
        expect(field.en.trim()).not.toBe('');
      }
      expect(t.keywords.length).toBeGreaterThan(0);
    }
  });

  it('exports JSON Schema for every tool', () => {
    for (const def of toToolDefinitions()) {
      expect(def.input_schema).toBeTypeOf('object');
      expect(def.output_schema).toBeTypeOf('object');
    }
  });

  it('leaves aiVisible:false tools out of the tool definitions', () => {
    const names = toToolDefinitions().map((d) => d.name);
    for (const t of tools) expect(names.includes(t.id)).toBe(t.aiVisible !== false);
  });

  // Keeps schemas honest: every example must validate in and out.
  for (const t of tools) {
    for (const ex of t.examples) {
      it(`${t.id}: example "${ex.description}" matches outputSchema`, () => {
        const out = callTool(t.id, ex.input);
        expect(t.outputSchema.safeParse(out).success).toBe(true);
      });
    }
  }

  it('rejects unknown tools and invalid input', () => {
    expect(() => callTool('nope', {})).toThrow(/Unknown tool/);
    for (const t of tools) expect(() => callTool(t.id, 'not an object')).toThrow();
  });
});
