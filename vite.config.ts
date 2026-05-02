import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    lib: {
      entry: 'src/bitbard.ts',
      fileName: 'bitbard',
      formats: ['es'],
    },
    outDir: 'dist',
    target: 'node24',
    rolldownOptions: {
      external: [/^node:/, 'pdfkit'],
      output: {
        entryFileNames: 'bitbard.js',
      },
    },
  },
});
