#!/usr/bin/env node
import { defineCommand, runMain } from 'citty';
import pdf from './commands/pdf/index.js';
import update from './commands/update.js';

const main = defineCommand({
  meta: {
    name: 'bitbard',
    version: '1.0.0',
    description: 'Bitbard CLI tool',
  },
  subCommands: {
    pdf,
    update,
  },
});

runMain(main);
