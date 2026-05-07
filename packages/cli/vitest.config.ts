import { defineConfig } from 'vitest/config';
import { join } from 'node:path';

export default defineConfig({
  define: {
    __APP_VERSION__: '"0.0.0-test"',
    __BIN_DIR__: JSON.stringify(join(import.meta.dirname, 'dist/bin')),
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
