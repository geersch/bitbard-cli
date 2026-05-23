import { defineCommand } from 'citty';
import list from './list.js';
import playSpeaker from './play-speaker.js';

export default defineCommand({
  meta: {
    name: 'chimes',
    description: 'Manage UniFi Protect chimes',
  },
  subCommands: {
    list,
    'play-speaker': playSpeaker,
  },
});
