import { z } from 'zod';
import { electricityMeta } from './electricity/meta';
import { laundryMeta } from './laundry/meta';
import type { ToolMeta } from './types';

/**
 * Single list of every tool. The home page, search, and (later) the AI
 * assistant all read from here. React-free on purpose so it can run in Node.
 * To add a tool: create src/tools/<id>/ and append its meta here and its View
 * in ./views.ts.
 */
export const tools: readonly ToolMeta[] = [laundryMeta, electricityMeta];

export function getTool(id: string): ToolMeta | undefined {
  return tools.find((t) => t.id === id);
}

/** Validate raw input (e.g. from an LLM) against the tool's schema, then run it. */
export function callTool(id: string, input: unknown): unknown {
  const tool = getTool(id);
  if (!tool) throw new Error(`Unknown tool: ${id}`);
  return tool.run(tool.inputSchema.parse(input));
}

/** JSON Schema definitions in the common LLM tool-calling shape. */
export function toToolDefinitions() {
  return tools.map((t) => ({
    name: t.id,
    description: `${t.name.en} (${t.name.th}): ${t.description.en}`,
    input_schema: z.toJSONSchema(t.inputSchema, { io: 'input' }),
    output_schema: z.toJSONSchema(t.outputSchema),
  }));
}
