import { defineCommand } from 'citty';
import flux from './flux.js';
import darkmode from './darkmode.js';
import truetone from './truetone.js';

export default defineCommand({
  meta: {
    name: 'screen',
    description: 'Screen-related commands',
  },
  subCommands: {
    darkmode,
    flux,
    truetone,
  },
});
