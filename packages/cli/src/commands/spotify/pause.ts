import { defineCommand } from 'citty';
import { pause } from '@bitbard/spotify/playback.js';

export default defineCommand({
  meta: {
    name: 'pause',
    description: 'Pause the currently playing track',
  },
  async run() {
    await pause();
  },
});
