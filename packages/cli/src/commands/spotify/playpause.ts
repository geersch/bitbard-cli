import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';
import { playpause } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'playpause',
    description: 'Toggle play / pause',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await playpause();
  },
});
