import { defineCommand } from 'citty';
import { sendCommand } from '@bitbard/core/daemon.js';
import chalk from 'chalk';
import { macosPlugin } from '../../plugins/macos.plugin.js';

export default defineCommand({
  meta: {
    name: 'flux',
    description: 'Toggle warm screen tint (reduces blue light)',
  },
  plugins: [macosPlugin],
  async run() {
    try {
      const res = await sendCommand({ flux: { action: 'toggle' } });
      if ((res.result as string) === 'enabled') {
        console.log(chalk.bold(chalk.yellow('Screen tint enabled.')));
      } else {
        console.log(chalk.bold(chalk.green('Screen tint disabled.')));
      }
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to toggle flux: ${(err as Error).message}`)));
    }
  },
});
