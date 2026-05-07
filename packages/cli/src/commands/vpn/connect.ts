import { defineCommand } from 'citty';
import { select, isCancel, intro, outro, spinner, log } from '@clack/prompts';
import { isMacOS } from '@bitbard/core/platform.js';
import { listVpnConfigs, startVpn, getVpnStatus } from '@bitbard/core/vpn.js';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 30_000;

async function waitForConnected(id: string): Promise<'Connected' | 'Disconnected' | 'Timeout'> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await getVpnStatus(id);
    if (status === 'Connected') return 'Connected';
    if (status === 'Disconnected') return 'Disconnected';
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return 'Timeout';
}

export default defineCommand({
  meta: {
    name: 'connect',
    description: 'Connect to a VPN configuration',
  },
  async run() {
    if (!isMacOS()) {
      log.error('The vpn command is only supported on macOS.');
      return;
    }

    try {
      const configs = await listVpnConfigs();

      if (configs.length === 0) {
        log.warn('No VPN configurations found.');
        return;
      }

      const active = configs.find((c) => c.status === 'Connected' || c.status === 'Connecting');
      if (active) {
        log.warn(`Already connected to: ${active.name}`);
        return;
      }

      intro('VPN');

      let targetId: string;
      let targetName: string;

      if (configs.length === 1) {
        targetId = configs[0].id;
        targetName = configs[0].name;
      } else {
        const choice = await select<string>({
          message: 'Select a VPN to connect',
          options: configs.map((c) => ({
            value: c.id,
            label: c.name,
            hint: c.status,
          })),
        });

        if (isCancel(choice)) return;

        targetId = choice;
        targetName = configs.find((c) => c.id === choice)!.name;
      }

      const s = spinner();
      s.start(`Connecting to ${targetName}…`);
      await startVpn(targetId);

      const result = await waitForConnected(targetId);

      if (result === 'Connected') {
        s.stop(`Connected to ${targetName}`);
        outro('Done');
      } else if (result === 'Disconnected') {
        s.stop('Connection failed');
        log.error(`Failed to connect to ${targetName}`);
      } else {
        s.stop('Timed out');
        log.error(`Connection to ${targetName} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
      }
    } catch (err) {
      log.error(`Failed to connect: ${(err as Error).message}`);
    }
  },
});
