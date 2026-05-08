import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const binDir =
  process.env.BITBARD_BIN_DIR ?? join(homedir(), '.local', 'share', 'bitbard', 'bin');
const BINARY = join(binDir, 'lock');

export function lockScreen(): void {
  const child = spawn(BINARY, [], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}
