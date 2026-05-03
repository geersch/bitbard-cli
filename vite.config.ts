import { defineConfig } from 'vite';
import { readFileSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import type { Plugin } from 'vite';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));

function swiftPlugin(): Plugin {
  return {
    name: 'swift-flux-helper',
    closeBundle() {
      // CoreGraphics / AppKit are macOS-only; skip Swift compilation on Linux CI runners
      if (process.platform !== 'darwin') {
        return;
      }
      mkdirSync('dist/bin', { recursive: true });
      const script =
        'for f in src/swift/*.swift; do name=$(basename "$f" .swift); swiftc "$f" -o "dist/bin/$name" -O; done';
      execSync(script, { stdio: 'inherit' });
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
