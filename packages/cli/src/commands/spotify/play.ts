import { defineCommand } from 'citty';
import { play } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'play',
    description: 'Play the currently selected track',
  },
  async run() {
    await play();
  },
});
