import { defineCommand } from 'citty';
import chalk from 'chalk';
import { getPortProcesses } from '@bitbard/core/network.js';

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List processes listening on a TCP port',
  },
  args: {
    port: {
      type: 'positional',
      description: 'Port number (1–65535)',
      required: true,
    },
  },
  async run({ args }) {
    const port = parseInt(args.port, 10);

    if (isNaN(port) || port < 1 || port > 65535) {
      console.log(chalk.bold(chalk.red(`Invalid port: "${args.port}". Must be an integer between 1 and 65535.`)));
      return;
    }

    const processes = await getPortProcesses(port);

    if (processes.length === 0) {
      console.log(chalk.dim(`No processes found on port ${port}.`));
      return;
    }

    for (const p of processes) {
      console.log(`${chalk.bold(String(p.pid))}  ${chalk.green(p.name)}  ${chalk.dim(p.socket)}`);
    }
  },
});
