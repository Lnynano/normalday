import type { ComponentType, LazyExoticComponent } from 'react';

/**
 * Tool id → lazily loaded View. Kept apart from registry.ts so the registry
 * stays React-free. Each View is code-split into its own chunk.
 */
export const toolViews: Record<string, LazyExoticComponent<ComponentType>> = {};
