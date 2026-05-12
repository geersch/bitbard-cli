import { defineCommand } from 'citty';
import { sendCommand } from '@bitbard/core/daemon.js';
import chalk from 'chalk';

export default defineCommand({
  meta: {
    name: 'truetone',
    description: 'Toggle macOS True Tone.',
  },
  async run() {
    try {
      const res = await sendCommand({ truetone: { action: 'toggle' } });
      if ((res.result as string) === 'enabled') {
        console.log(chalk.bold(chalk.green('True Tone enabled.')));
      } else {
        console.log(chalk.bold(chalk.yellow('True Tone disabled.')));
      }
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to toggle True Tone: ${(err as Error).message}`)));
    }
  },
});
