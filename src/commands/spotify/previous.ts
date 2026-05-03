import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '../../util/platform.js';
import { previousTrack } from '../../util/spotify.js';

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
