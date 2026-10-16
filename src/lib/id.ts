/** Short unique id for list entries. randomUUID needs a secure context, so keep a fallback. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
