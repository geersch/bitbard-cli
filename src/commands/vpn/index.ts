import { defineCommand } from 'citty';
import list from './list.js';
import status from './status.js';
import connect from './connect.js';
import disconnect from './disconnect.js';

export default defineCommand({
  meta: {
    name: 'vpn',
    description: 'Manage VPN connections',
  },
  subCommands: {
    connect,
    disconnect,
    list,
    status,
  },
});
