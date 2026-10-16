import { defineConfig } from 'vitest/config';

// Separate from vite.config.ts so tests skip the PWA/Tailwind plugins.
// Tests cover pure logic only, so plain Node is enough (no DOM).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
