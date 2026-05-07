#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import display from './commands/display/index.js';
import spotify from './commands/spotify/index.js';
import system from './commands/system/index.js';
import vpn from './commands/vpn/index.js';
import upgrade from './commands/upgrade.js';

const main = defineCommand({
  meta: {
    name: 'bitbard',
    version: __APP_VERSION__,
    description: 'Bitbard CLI',
  },
  subCommands: {
    display,
    spotify,
    system,
    vpn,
    upgrade,
  },
});

runMain(main);
