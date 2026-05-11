import { execSync } from 'node:child_process';
import { sendCommand } from './daemon.js';

export function lockScreen(): void {
  sendCommand({ command: 'lock' }).catch((err: Error) => {
    process.stderr.write(`bitbard: ${err.message}\n`);
  });
}

export function startScreensaver(): void {
  execSync('open -a ScreenSaverEngine');
}
