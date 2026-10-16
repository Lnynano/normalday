import type { z } from 'zod';

export type Lang = 'th' | 'en';
export type Localized = Record<Lang, string>;

/**
 * Everything the app (and later an AI assistant) needs to know about a tool.
 *
 * - `inputSchema` / `outputSchema` are the source of truth: TS types come from
 *   them, inputs are validated with them, and `registry.toToolDefinitions()`
 *   turns them into JSON Schema for LLM tool-calling. Add `.describe()` to
 *   fields so the AI understands them.
 * - `run` must be pure (no React, no DOM, no storage).
 * - `examples` double as documentation for the AI and as registry tests:
 *   each one is run and its output checked against `outputSchema`.
 */
export interface ToolMeta<I extends z.ZodType = z.ZodType, O extends z.ZodType = z.ZodType> {
  id: string;
  name: Localized;
  description: Localized;
  /** Extra search terms, Thai and English, lowercase. */
  keywords: string[];
  /** Emoji shown on the home tile. */
  icon: string;
  inputSchema: I;
  outputSchema: O;
  run(input: z.output<I>): z.output<O>;
  examples: { description: string; input: z.input<I> }[];
  /**
   * false = leave out of the AI tool list. For tools whose real data only lives
   * on the user's device, so the AI has nothing useful to call. Default true.
   */
  aiVisible?: boolean;
}

/** Identity helper that keeps `run` and `examples` typed against the schemas. */
export function defineTool<I extends z.ZodType, O extends z.ZodType>(meta: ToolMeta<I, O>): ToolMeta<I, O> {
  return meta;
}
