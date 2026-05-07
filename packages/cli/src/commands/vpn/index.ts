import { defineCommand } from 'citty';
import list from './list.js';
import status from './status.js';
import connect from './connect.js';
import disconnect from './disconnect.js';
import { macosPlugin } from '../../plugins/macos.js';

export default defineCommand({
  meta: {
    name: 'vpn',
    description: 'Manage VPN connections',
  },
  plugins: [macosPlugin],
  subCommands: {
    connect,
    disconnect,
    list,
    status,
  },
});
