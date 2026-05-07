import { defineCittyPlugin } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';

export const macosPlugin = defineCittyPlugin({
  name: 'macos',
  setup() {
    if (!isMacOS()) {
      console.error(chalk.bold(chalk.red('This command is only supported on macOS.')));
      process.exit(1);
    }
  },
});
