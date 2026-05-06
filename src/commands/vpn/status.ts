import { defineCommand } from 'citty';
import chalk from 'chalk';
import { isMacOS } from '../../util/platform.js';
import { listVpnConfigs } from '../../util/vpn.js';

export default defineCommand({
  meta: {
    name: 'status',
    description: 'Show the current VPN connection status',
  },
  async run() {
    if (!isMacOS()) {
      console.log(chalk.bold(chalk.red('The vpn command is only supported on macOS.')));
      return;
    }

    try {
      const configs = await listVpnConfigs();
      const active = configs.find((c) => c.status === 'Connected' || c.status === 'Connecting');

      if (active) {
        console.log(`${chalk.bold(chalk.green(`[${active.status}]`))}  ${chalk.bold(active.name)}`);
      } else {
        console.log(chalk.dim('[Disconnected]'));
      }
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to get VPN status: ${(err as Error).message}`)));
    }
  },
});
