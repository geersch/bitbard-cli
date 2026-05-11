import { sendCommand } from './daemon.js';
import { isMacOS } from './platform.js';

/**
 * Simple on-screen alerts.
 *
 * Displays a dark, semi-transparent rounded pill with white text centred on
 * the main screen. Delegated to the bitbardd daemon.
 *
 * @param message  Text to display.
 * @param duration Seconds to keep the alert visible (default: 2).
 */
export function showAlert(message: string, duration = 2): void {
  if (!isMacOS()) return;

  sendCommand({ command: 'alert', message, duration }).catch((err: Error) => {
    process.stderr.write(`bitbard: ${err.message}\n`);
  });
}
