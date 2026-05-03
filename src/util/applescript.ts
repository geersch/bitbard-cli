import { execFile } from 'node:child_process';
import { isMacOS } from './platform.js';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export async function runAppleScript(script: string): Promise<string> {
  if (!isMacOS()) {
    throw new Error('AppleScript is only supported on macOS.');
  }

  const { stdout } = await execFileAsync('osascript', ['-e', script]);
  return stdout.trim();
}
