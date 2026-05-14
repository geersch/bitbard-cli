import { defineCommand } from 'citty';
import { nextTrack } from '@bitbard/spotify/playback.js';

export default defineCommand({
  meta: {
    name: 'next',
    description: 'Skip to the next track',
  },
  async run() {
    await nextTrack();
  },
});
