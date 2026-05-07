import { defineCommand } from 'citty';
import { playpause } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'playpause',
    description: 'Toggle play / pause',
  },
  async run() {
    await playpause();
  },
});
