#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import upgrade from './commands/upgrade.js';
import pdf from './commands/pdf/index.js';
import display from './commands/display/index.js';
import spotify from './commands/spotify/index.js';
import system from './commands/system/index.js';
import vpn from './commands/vpn/index.js';

const main = defineCommand({
  meta: {
    name: 'bitbard',
    version: __APP_VERSION__,
    description: 'Bitbard CLI',
  },
  subCommands: {
    pdf,
    display,
    spotify,
    system,
    vpn,
    upgrade,
  },
});

runMain(main);
