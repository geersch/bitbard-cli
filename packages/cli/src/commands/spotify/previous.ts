import { defineCommand } from 'citty';
import { previousTrack } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'previous',
    description: 'Skip to the previous track',
  },
  async run() {
    await previousTrack();
  },
});
