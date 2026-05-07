import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isMacOS } from './platform.js';

const binDir = process.env.BITBARD_BIN_DIR ?? join(dirname(fileURLToPath(import.meta.url)), 'bin');
const BINARY = join(binDir, 'alert');

/**
 * Simple on-screen alerts.
 *
 * Displays a dark, semi-transparent rounded pill with white text centred on
 * the main screen.
 *
 * @param message  Text to display.
 * @param duration Seconds to keep the alert visible (default: 2).
 */
export function showAlert(message: string, duration = 2): void {
  if (!isMacOS()) return;

  const child = spawn(BINARY, [message, String(duration)], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
}
