import { defineCommand } from 'citty';
import { play } from '@bitbard/spotify/playback.js';

export default defineCommand({
  meta: {
    name: 'play',
    description: 'Play the currently selected track',
  },
  async run() {
    await play();
  },
});
