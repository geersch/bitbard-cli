import { defineCommand } from 'citty';
import { intro, outro, spinner, log } from '@clack/prompts';
import { isMacOS } from '@bitbard/core/platform.js';
import { listVpnConfigs, stopVpn, getVpnStatus } from '@bitbard/core/vpn.js';

const POLL_INTERVAL_MS = 500;
const POLL_TIMEOUT_MS = 30_000;

async function waitForDisconnected(id: string): Promise<'Disconnected' | 'Timeout'> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const status = await getVpnStatus(id);
    if (status === 'Disconnected') return 'Disconnected';
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  return 'Timeout';
}

export default defineCommand({
  meta: {
    name: 'disconnect',
    description: 'Disconnect the active VPN connection',
  },
  async run() {
    if (!isMacOS()) {
      log.error('The vpn command is only supported on macOS.');
      return;
    }

    try {
      const configs = await listVpnConfigs();
      const active = configs.find((c) => c.status === 'Connected' || c.status === 'Connecting');

      if (!active) {
        log.warn('No active VPN connection.');
        return;
      }

      intro('VPN');

      const s = spinner();
      s.start(`Disconnecting from ${active.name}…`);
      await stopVpn(active.id);

      const result = await waitForDisconnected(active.id);

      if (result === 'Disconnected') {
        s.stop(`Disconnected from ${active.name}`);
        outro('Done');
      } else {
        s.stop('Timed out');
        log.error(`Disconnect from ${active.name} timed out after ${POLL_TIMEOUT_MS / 1000}s`);
      }
    } catch (err) {
      log.error(`Failed to disconnect: ${(err as Error).message}`);
    }
  },
});
