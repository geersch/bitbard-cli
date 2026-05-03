import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '../../util/platform.js';
import { play } from '../../util/spotify.js';

export default defineCommand({
  meta: {
    name: 'play',
    description: 'Play the currently selected track',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await play();
  },
});
