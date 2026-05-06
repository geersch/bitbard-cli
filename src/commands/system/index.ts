import { defineCommand } from 'citty';
import info from './info.js';

export default defineCommand({
  meta: {
    name: 'system',
    description: 'System-related commands',
  },
  subCommands: {
    info,
  },
});
