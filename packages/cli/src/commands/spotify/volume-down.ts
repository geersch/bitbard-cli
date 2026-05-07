import { defineCommand } from 'citty';
import { volumeDown } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'volume-down',
    description: 'Decrease Spotify volume by 5',
  },
  async run() {
    await volumeDown();
  },
});
