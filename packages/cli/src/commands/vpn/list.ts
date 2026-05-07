import { defineCommand } from 'citty';
import chalk from 'chalk';
import { listVpnConfigs, type VpnStatus } from '@bitbard/core/vpn.js';

const statusColor: Record<VpnStatus, (s: string) => string> = {
  Connected: (s) => chalk.bold(chalk.green(s)),
  Connecting: (s) => chalk.bold(chalk.yellow(s)),
  Disconnecting: (s) => chalk.bold(chalk.yellow(s)),
  Disconnected: (s) => chalk.dim(s),
  Unknown: (s) => chalk.dim(s),
};

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List all VPN configurations and their status',
  },
  async run() {
    try {
      const configs = await listVpnConfigs();

      if (configs.length === 0) {
        console.log(chalk.dim('No VPN configurations found.'));
        return;
      }

      for (const config of configs) {
        const colorFn = statusColor[config.status];
        const status = colorFn(`[${config.status}]`);
        console.log(`${chalk.bold(config.name)}  ${status}`);
      }
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to list VPN configurations: ${(err as Error).message}`)));
    }
  },
});
