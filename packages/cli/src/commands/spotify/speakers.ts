import { defineCommand } from 'citty';
import chalk from 'chalk';
import { getDevices } from '@bitbard/spotify/devices.js';

export default defineCommand({
  meta: {
    name: 'speakers',
    description: 'List available Spotify Connect devices',
  },
  async run() {
    const devices = await getDevices();
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
