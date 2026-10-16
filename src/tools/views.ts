import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Tool id → lazily loaded View. Kept apart from registry.ts so the registry
 * stays React-free. Each View is code-split into its own chunk.
 */
export const toolViews: Record<string, LazyExoticComponent<ComponentType>> = {
  laundry: lazy(() => import('./laundry/View')),
  electricity: lazy(() => import('./electricity/View')),
  'bill-split': lazy(() => import('./bill-split/View')),
};
