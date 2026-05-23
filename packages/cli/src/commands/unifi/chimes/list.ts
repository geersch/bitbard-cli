import { defineCommand } from 'citty';
import { isLoggedIn, getCredentials } from '@bitbard/unifi/auth.js';
import { getChimes } from '@bitbard/unifi/protect/chime.js';

export default defineCommand({
  meta: {
    name: 'list',
    description: 'List UniFi Protect chimes',
  },
  async run() {
    if (!(await isLoggedIn())) {
      console.log('UniFi login required. Run: bitbard unifi login');
      return;
    }

    const creds = await getCredentials();
    const chimes = await getChimes(creds.shared.host, creds.public.apiKey);

    if (chimes.length === 0) {
      console.log('No chimes found.');
      return;
    }

    for (const chime of chimes) {
      console.log(`${chime.name}  ${chime.state} (${chime.id})`);
    }
  },
});
