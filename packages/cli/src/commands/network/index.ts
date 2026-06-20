import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.plugin.js';
import ip from './ip.js';

export default defineCommand({
  meta: {
    name: 'network',
    description: 'Network utilities',
  },
  plugins: [macosPlugin],
  subCommands: {
    ip,
  },
});
