import { defineCommand } from 'citty';
import { volumeUp } from '@bitbard/spotify/playback.js';

export default defineCommand({
  meta: {
    name: 'volume-up',
    description: 'Increase Spotify volume by 5',
  },
  async run() {
    await volumeUp();
  },
});
