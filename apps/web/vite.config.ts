import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@catnoted/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@catnoted/editor': path.resolve(__dirname, '../../packages/editor/src/index.ts'),
      '@catnoted/canvas': path.resolve(__dirname, '../../packages/canvas/src/index.ts'),
      '@catnoted/graph': path.resolve(__dirname, '../../packages/graph/src/index.ts'),
      '@catnoted/agent-runtime': path.resolve(__dirname, '../../packages/agent-runtime/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true
  }
});
