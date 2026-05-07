import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';
import { launch } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'launch',
    description: 'Launch Spotify (or bring it to the foreground)',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await launch();
  },
});
