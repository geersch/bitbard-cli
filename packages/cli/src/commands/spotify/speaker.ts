import { defineCommand } from 'citty';
import { select, isCancel } from '@clack/prompts';
import chalk from 'chalk';
import { getDevices, transferPlayback } from '@bitbard/spotify/devices.js';

export default defineCommand({
  meta: {
    name: 'speaker',
    description: 'Switch Spotify playback to a device (interactive if no ID given)',
  },
  args: {
    id: {
      type: 'positional',
      description: 'Spotify device ID (optional — shows list if omitted)',
      required: false,
    },
  },
  async run({ args }) {
    const devices = await getDevices();

    if (devices.length === 0) {
      console.log('No devices found. Open Spotify on a device first.');
      return;
    }

    if (args.id) {
      const device = devices.find((d) => d.id === args.id);
      if (!device) {
        console.log(chalk.red(`No device with ID "${args.id}" found.`));
        return;
      }
      await transferPlayback(device.id);
      console.log(chalk.bold(chalk.green(`Playback transferred to ${device.name}.`)));
      return;
    }

    const choice = await select({
      message: 'Select a device',
      options: devices.map((d) => ({
        value: d.id,
        label: `${d.name}  ${chalk.dim(d.type)}${d.isActive ? chalk.green(' (active)') : ''}`,
      })),
    });

    if (isCancel(choice)) {
      return;
    }

    const selected = devices.find((d) => d.id === choice)!;
    await transferPlayback(choice as string);
    console.log(chalk.bold(chalk.green(`Playback transferred to ${selected.name}.`)));
  },
});
