import { defineCommand } from 'citty';
import info from './info.js';
import lock from './lock.js';
import screensaver from './screensaver.js';

export default defineCommand({
  meta: {
    name: 'system',
    description: 'System-related commands',
  },
  subCommands: {
    info,
    lock,
    screensaver,
  },
});
