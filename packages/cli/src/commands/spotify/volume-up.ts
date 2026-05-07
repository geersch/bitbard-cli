import { defineCommand } from 'citty';
import { volumeUp } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'volume-up',
    description: 'Increase Spotify volume by 5',
  },
  async run() {
    await volumeUp();
  },
});
