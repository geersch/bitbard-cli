import { defineCommand } from 'citty';
import flux from './flux.js';
import darkmode from './darkmode.js';
import truetone from './truetone.js';
import { macosPlugin } from '../../plugins/macos.plugin.js';

export default defineCommand({
  meta: {
    name: 'display',
    description: 'Display-related commands',
  },
  plugins: [macosPlugin],
  subCommands: {
    darkmode,
    flux,
    truetone,
  },
});
