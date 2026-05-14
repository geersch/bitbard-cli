import { defineCommand } from 'citty';
import { macosPlugin } from '../../../plugins/macos.plugin.js';
import mute from './mute.js';
import unmute from './unmute.js';
import status from './status.js';

export default defineCommand({
  meta: {
    name: 'input',
    description: 'Audio input device commands',
  },
  plugins: [macosPlugin],
  subCommands: {
    mute,
    unmute,
    status,
  },
});
