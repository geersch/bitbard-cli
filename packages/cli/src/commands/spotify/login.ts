import { defineCommand } from 'citty';
import { login, isLoggedIn } from '@bitbard/spotify/auth.js';
import { spinner } from '@clack/prompts';

export default defineCommand({
  meta: {
    name: 'login',
    description: 'Log in to Spotify via OAuth (requires your Spotify Developer client ID)',
  },
  args: {
    'client-id': {
      type: 'string',
      description: 'Your Spotify Developer app client ID',
      required: true,
    },
  },
  async run({ args }) {
    if (await isLoggedIn()) {
      console.log('Already logged in to Spotify. Run: bitbard spotify logout to switch accounts.');
      return;
    }

    const s = spinner();
    s.start('Waiting for Spotify login in browser…');
    try {
      await login(args['client-id']);
    } catch (err) {
      s.stop('Login failed');
      throw err;
    }
    s.stop('Logged in to Spotify');
  },
});
