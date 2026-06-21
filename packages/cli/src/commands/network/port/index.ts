import { defineCommand } from 'citty';
import list from './list.js';
import kill from './kill.js';

export default defineCommand({
  meta: {
    name: 'port',
    description: 'List or kill processes on a TCP port',
  },
  subCommands: {
    list,
    kill,
  },
});
