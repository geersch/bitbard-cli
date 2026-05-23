import { defineCommand } from 'citty';
import { select, isCancel, spinner } from '@clack/prompts';
import { isLoggedIn, getCredentials, getPrivateSession } from '@bitbard/unifi/auth.js';
import { getChimes, playSpeaker } from '@bitbard/unifi/protect/chime.js';

export default defineCommand({
  meta: {
    name: 'play-speaker',
    description: 'Play a sound on a UniFi Protect chime',
  },
  args: {
    id: {
      type: 'positional',
      description: 'Chime ID (optional — shows list if omitted)',
      required: false,
    },
    'ringtone-id': {
      type: 'string',
      description: 'Ringtone ID',
      required: false,
    },
    volume: {
      type: 'string',
      description: 'Volume (integer)',
      required: false,
    },
  },
  async run({ args }) {
    if (!(await isLoggedIn())) {
      console.log('UniFi login required. Run: bitbard unifi login');
      return;
    }

    const creds = await getCredentials();
    const { host } = creds.shared;
    const { apiKey } = creds.public;
    const { username, password } = creds.private;

    let chimeId: string;

    if (args.id) {
      chimeId = args.id;
    } else {
      const chimes = await getChimes(host, apiKey);

      if (chimes.length === 0) {
        console.log('No chimes found.');
        return;
      }

      const choice = await select({
        message: 'Select a chime',
        options: chimes.map((c) => ({ value: c.id, label: c.name })),
      });

      if (isCancel(choice)) {
        return;
      }

      chimeId = choice as string;
    }

    const auth = await getPrivateSession(host, username, password);

    const parsedVolume = args.volume !== undefined ? parseInt(args.volume, 10) : undefined;
    const volume = parsedVolume !== undefined && !Number.isNaN(parsedVolume) ? parsedVolume : undefined;
    const ringtoneId = args['ringtone-id'];

    const s = spinner();
    s.start('Playing chime…');
    try {
      await playSpeaker(host, auth, chimeId, {
        volume,
        ringtoneId,
      });
    } catch (err) {
      s.stop('Failed to play chime');
      throw err;
    }
    s.stop('Done.');
  },
});
