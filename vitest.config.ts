import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ["./setupTests.ts"],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@catnoted/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      '@catnoted/graph': path.resolve(__dirname, './packages/graph/src/index.ts'),
      '@catnoted/agent-runtime': path.resolve(__dirname, './packages/agent-runtime/src/index.ts'),
      '@catnoted/editor': path.resolve(__dirname, './packages/editor/src/index.ts'),
      '@catnoted/canvas': path.resolve(__dirname, './packages/canvas/src/index.ts'),
    },
  },
});
