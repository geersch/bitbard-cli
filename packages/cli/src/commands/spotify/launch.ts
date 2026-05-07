import { defineCommand } from 'citty';
import { launch } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'launch',
    description: 'Launch Spotify (or bring it to the foreground)',
  },
  async run() {
    await launch();
  },
});
