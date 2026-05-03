import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '../../util/platform.js';
import { pause } from '../../util/spotify.js';

export default defineCommand({
  meta: {
    name: 'pause',
    description: 'Pause the currently playing track',
  },
  async run() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('The spotify command is only supported on macOS.')));
      return;
    }
    await pause();
  },
});
