import { spawn, execSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const binDir = process.env.BITBARD_BIN_DIR ?? join(homedir(), '.local', 'share', 'bitbard', 'bin');
const LOCK_BINARY = join(binDir, 'lock');

export function lockScreen(): void {
  const child = spawn(LOCK_BINARY, [], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}

export function startScreensaver(): void {
  execSync('open -a ScreenSaverEngine');
}
