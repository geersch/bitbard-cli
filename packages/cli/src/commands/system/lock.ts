import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.js';
import { lockScreen } from '@bitbard/core/lock.js';

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
