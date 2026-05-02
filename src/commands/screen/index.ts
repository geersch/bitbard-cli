import { defineCommand } from 'citty';
import flux from './flux.js';

export default defineCommand({
  meta: {
    name: 'screen',
    description: 'Screen-related commands',
  },
  subCommands: {
    flux,
  },
});
