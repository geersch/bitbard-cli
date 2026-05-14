import { defineCommand } from 'citty';
import { logout } from '@bitbard/spotify/auth.js';
import { log } from '@clack/prompts';

export default defineCommand({
  meta: {
    name: 'logout',
    description: 'Log out of Spotify',
  },
  async run() {
    await logout();

    log.success('Logged out of Spotify');
  },
});
