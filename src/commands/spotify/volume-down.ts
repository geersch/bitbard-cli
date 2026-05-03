import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '../../util/platform.js';
import { volumeDown } from '../../util/spotify.js';

export default defineCommand({
  meta: {
    name: 'volume-down',
    description: 'Decrease Spotify volume by 5',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await volumeDown();
  },
});
