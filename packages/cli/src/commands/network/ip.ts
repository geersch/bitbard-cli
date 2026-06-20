import { defineCommand } from 'citty';
import chalk from 'chalk';
import { spinner } from '@clack/prompts';
import { getLocalIp, getPublicIp } from '@bitbard/core/network.js';

export default defineCommand({
  meta: {
    name: 'ip',
    description: 'Print local and public IP addresses',
  },
  async run() {
    const localIp = getLocalIp();

    const s = spinner();
    s.start('Fetching public IP\u2026');

    const publicIp = await getPublicIp();

    s.stop();

    const local = localIp ? chalk.bold(localIp) : chalk.dim('(unavailable)');
    const pub = publicIp ? chalk.bold(publicIp) : chalk.dim('(unavailable)');

    console.log(`${chalk.dim('Local: ')} ${local}`);
    console.log(`${chalk.dim('Public:')} ${pub}`);
  },
});
