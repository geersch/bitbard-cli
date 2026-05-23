import { defineCommand } from 'citty';
import chalk from 'chalk';
import { getDevices, SpotifyDevice } from '@bitbard/spotify/devices.js';
import { isLoggedIn } from '@bitbard/spotify/auth.js';
import { SpotifyNotLoggedInError } from '@bitbard/spotify/errors.js';

export default defineCommand({
  meta: {
    name: 'speakers',
    description: 'List available Spotify Connect devices',
  },
  async run() {
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

    for (const device of devices) {
      const active = device.isActive ? chalk.green(' (active)') : '';
      console.log(`  ${chalk.bold(device.name.padEnd(20))}  ${chalk.dim(device.type)}${active}`);
    }
  },
});
