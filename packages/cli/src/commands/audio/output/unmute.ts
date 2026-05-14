import { defineCommand } from 'citty';
import chalk from 'chalk';
import { AudioDevice } from '@bitbard/core/audiodevice.js';
import { macosPlugin } from '../../../plugins/macos.plugin.js';

export default defineCommand({
  meta: {
    name: 'unmute',
    description: 'Unmute the default audio output device',
  },
  plugins: [macosPlugin],
  async run() {
    const device = await AudioDevice.defaultOutput();
    if (!device) {
      console.log(chalk.bold(chalk.red('No default output device found.')));
      return;
    }
    try {
      await device.unmute();
      console.log(chalk.bold(chalk.green(`Unmuted: ${device.name}`)));
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to unmute: ${(err as Error).message}`)));
    }
  },
});
