#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import audio from './commands/audio/index.js';
import display from './commands/display/index.js';
import spotify from './commands/spotify/index.js';
import system from './commands/system/index.js';
import unifi from './commands/unifi/index.js';
import network from './commands/network/index.js';
import vpn from './commands/vpn/index.js';
import upgrade from './commands/upgrade.js';

const main = defineCommand({
  meta: {
    name: 'bitbard',
    version: __APP_VERSION__,
    description: 'Bitbard CLI',
  },
  subCommands: {
    audio,
    display,
    network,
    spotify,
    system,
    unifi,
    vpn,
    upgrade,
  },
});

runMain(main);
