import { defineConfig } from 'rolldown';
import { execSync } from 'node:child_process';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function buildVersion(): string {
  const commitUnixTs = parseInt(execSync('git log -1 --pretty=%ct').toString().trim(), 10);
  const sha = execSync('git rev-parse --short HEAD').toString().trim();

  const d = new Date(commitUnixTs * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const MM = pad(d.getMonth() + 1);
  const DD = pad(d.getDate());
  const HH = pad(d.getHours());
  const mm = pad(d.getMinutes());

  return `${yy}.${MM}${DD}.${HH}${mm}-${sha}`;
}

export default defineConfig({
  input: 'src/bitbard.ts',
  platform: 'node',
  external: [/^node:/],
  transform: {
    define: {
      __APP_VERSION__: JSON.stringify(buildVersion()),
    },
  },
  output: {
    format: 'esm',
    dir: 'dist',
    entryFileNames: 'bitbard.js',
  },
});
