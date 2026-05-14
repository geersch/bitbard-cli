import { defineCommand } from 'citty';
import { select, isCancel } from '@clack/prompts';
import chalk from 'chalk';
import { getDevices, SpotifyDevice, transferPlayback } from '@bitbard/spotify/devices.js';
import { isLoggedIn } from '@bitbard/spotify/auth';
import { SpotifyNotLoggedInError } from '@bitbard/spotify/errors';

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
    if (!(await isLoggedIn())) {
      console.log('Spotify login required. Run: bitbard spotify login to log in.');
      return;
    }

    let devices: SpotifyDevice[];
    try {
      devices = await getDevices();
    } catch (err) {
      if (err instanceof SpotifyNotLoggedInError) {
        console.error('Spotify login required. Run: bitbard spotify login to log in.');
        return;
      } else {
        throw err;
      }
    }

    if (devices.length === 0) {
      console.log('No devices found. Open Spotify on a device first.');
      return;
    }

    if (args.id) {
      const device = devices.find((d) => d.id === args.id);
      if (!device) {
        console.error(chalk.red(`No device with ID "${args.id}" found.`));
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
