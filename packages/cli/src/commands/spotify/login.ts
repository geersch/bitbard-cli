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
    port: {
      type: 'string',
      description:
        'Local port for the OAuth redirect callback (default: 8888). Must match a redirect URI configured in your Spotify Developer app (e.g. http://127.0.0.1:<port>/callback).',
      required: false,
      default: '8888',
    },
  },
  async run({ args }) {
    if (await isLoggedIn()) {
      console.log('Already logged in to Spotify. Run: bitbard spotify logout to switch accounts.');
      return;
    }

    const port = Number(args.port);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error(`Invalid port: ${args.port}. Must be an integer between 1 and 65535.`);
      return;
    }

    const s = spinner();
    s.start('Waiting for Spotify login in browser…');
    try {
      await login(args['client-id'], port);
    } catch (err) {
      s.stop('Login failed');
      throw err;
    }
    s.stop('Logged in to Spotify');
  },
});
