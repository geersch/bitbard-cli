import { defineCommand } from 'citty';
import { volumeDown } from '@bitbard/spotify/playback.js';

export default defineCommand({
  meta: {
    name: 'volume-down',
    description: 'Decrease Spotify volume by 5',
  },
  async run() {
    await volumeDown();
  },
});
