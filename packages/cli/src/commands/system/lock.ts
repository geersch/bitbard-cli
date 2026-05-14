import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.plugin.js';
import { lockScreen } from '@bitbard/core/caffeinate.js';

export default defineCommand({
  meta: {
    name: 'lock',
    description: 'Lock the screen',
  },
  plugins: [macosPlugin],
  run() {
    lockScreen();
  },
});
