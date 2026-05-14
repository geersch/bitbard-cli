import { defineCommand } from 'citty';
import chalk from 'chalk';
import { AudioDevice } from '@bitbard/core/audiodevice.js';
import { macosPlugin } from '../../../plugins/macos.plugin.js';

export default defineCommand({
  meta: {
    name: 'status',
    description: 'Show the default audio input device',
  },
  plugins: [macosPlugin],
  async run() {
    const device = await AudioDevice.defaultInput();
    if (!device) {
      console.log(chalk.bold(chalk.red('No default input device found.')));
      return;
    }
    const muteStatus = device.isMuted ? chalk.red('muted') : chalk.green('active');
    console.log(`${chalk.bold(device.name)} — ${muteStatus}`);
  },
});
