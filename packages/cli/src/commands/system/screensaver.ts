import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.js';
import { startScreensaver } from '@bitbard/core/caffeinate.js';

export default defineCommand({
  meta: {
    name: 'screensaver',
    description: 'Start the screensaver',
  },
  plugins: [macosPlugin],
  run() {
    startScreensaver();
  },
});
