import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.plugin.js';
import ip from './ip.js';
import port from './port/index.js';

export default defineCommand({
  meta: {
    name: 'network',
    description: 'Network utilities',
  },
  plugins: [macosPlugin],
  subCommands: {
    ip,
    port,
  },
});
