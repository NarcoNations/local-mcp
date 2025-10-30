import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@/examples/next-adapter': fileURLToPath(new URL('./', import.meta.url)),
      '@/packages': fileURLToPath(new URL('../../packages', import.meta.url))
    }
  }
});
