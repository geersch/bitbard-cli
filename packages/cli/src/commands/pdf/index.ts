import { defineCommand } from 'citty';
import convert from './convert.js';

export default defineCommand({
  meta: {
    name: 'pdf',
    description: 'PDF-related commands',
  },
  subCommands: {
    convert,
  },
});
