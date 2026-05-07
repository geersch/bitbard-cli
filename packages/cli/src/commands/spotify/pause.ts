import { defineCommand } from 'citty';
import { pause } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'pause',
    description: 'Pause the currently playing track',
  },
  async run() {
    await pause();
  },
});
