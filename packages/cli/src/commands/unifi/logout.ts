import { defineCommand } from 'citty';
import { log } from '@clack/prompts';
import { deleteCredentials } from '@bitbard/unifi/auth.js';

export default defineCommand({
  meta: {
    name: 'logout',
    description: 'Log out of UniFi',
  },
  async run() {
    await deleteCredentials();
    log.success('Logged out of UniFi');
  },
});
