import { defineCommand } from 'citty';
import login from './login.js';
import logout from './logout.js';
import chimes from './chimes/index.js';

export default defineCommand({
  meta: {
    name: 'unifi',
    description: 'Control UniFi Devices',
  },
  subCommands: {
    login,
    logout,
    chimes,
  },
});
