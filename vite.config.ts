import { defineConfig } from 'vite';
import { readFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

function swiftPlugin(): Plugin {
  return {
    name: 'swift-flux-helper',
    closeBundle() {
      // CoreGraphics is macOS-only; skip Swift compilation on Linux CI runners
      if (process.platform !== 'darwin') {
        return;
      }
      mkdirSync('dist/bin', { recursive: true });
      execSync('swiftc src/commands/screen/swift/flux.swift -o dist/bin/screen-flux -O', { stdio: 'inherit' });
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [swiftPlugin()],
  resolve: {
    conditions: ['node', 'import', 'default'],
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
