import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],
    alias: {
      '@catnoted/shared': path.resolve(__dirname, './packages/shared/src/'),
      '@catnoted/graph': path.resolve(__dirname, './packages/graph/src/'),
      '@catnoted/agent-runtime': path.resolve(__dirname, './packages/agent-runtime/src/'),
      '@catnoted/editor': path.resolve(__dirname, './packages/editor/src/'),
      '@catnoted/canvas': path.resolve(__dirname, './packages/canvas/src/'),
    },
  },
});
