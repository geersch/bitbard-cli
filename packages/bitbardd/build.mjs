import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

if (process.platform !== 'darwin') {
  console.log('Skipping bitbardd Swift build on non-darwin platform.');
  process.exit(0);
}

mkdirSync('dist', { recursive: true });

const sourcesDir = resolve(__dirname, 'Sources');
execSync(`swiftc "${sourcesDir}"/*.swift -o dist/bitbardd -O -framework AppKit -framework CoreGraphics`, {
  stdio: 'inherit',
});
