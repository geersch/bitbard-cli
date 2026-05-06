#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import info from './commands/info.js';
import update from './commands/update.js';
import pdf from './commands/pdf/index.js';
import display from './commands/display/index.js';
import spotify from './commands/spotify/index.js';

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
    info,
    update,
  },
});

runMain(main);
