import { defineCommand } from 'citty';
import chalk from 'chalk';
import { select, confirm, isCancel, log } from '@clack/prompts';
import { getPortProcesses, killProcess } from '@bitbard/core/network.js';
import type { PortProcess } from '@bitbard/core/network.js';

export default defineCommand({
  meta: {
    name: 'kill',
    description: 'Kill the process listening on a TCP port',
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
      log.warn(`No processes found on port ${port}.`);
      return;
    }

    let target: PortProcess;

    if (processes.length === 1) {
      target = processes[0];
    } else {
      const choice = await select<number>({
        message: `Multiple processes on port ${port}. Select one to kill:`,
        options: processes.map((p) => ({
          value: p.pid,
          label: p.name,
          hint: `${p.socket} (PID: ${p.pid})`,
        })),
      });

      if (isCancel(choice)) return;

      target = processes.find((p) => p.pid === choice)!;
    }

    const confirmed = await confirm({
      message: `Kill ${target.name} (PID: ${target.pid})?`,
    });

    if (isCancel(confirmed) || !confirmed) return;

    try {
      killProcess(target.pid);
      log.success(`Killed ${target.name} (PID: ${target.pid})`);
    } catch (err) {
      log.error(`Failed to kill ${target.name} (PID: ${target.pid}): ${(err as Error).message}`);
    }
  },
});
