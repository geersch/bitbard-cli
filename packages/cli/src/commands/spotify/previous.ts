import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';
import { previousTrack } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'previous',
    description: 'Skip to the previous track',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await previousTrack();
  },
});
