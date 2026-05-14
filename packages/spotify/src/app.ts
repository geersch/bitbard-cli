import { runAppleScript } from '@bitbard/core/applescript.js';

const tell = (cmd: string): Promise<string> => runAppleScript(`tell application "Spotify" to ${cmd}`);

export async function launch(): Promise<void> {
  await tell('activate');
}
