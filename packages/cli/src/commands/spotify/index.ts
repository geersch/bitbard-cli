import { defineCommand } from 'citty';
import launch from './launch.js';
import play from './play.js';
import pause from './pause.js';
import playpause from './playpause.js';
import previous from './previous.js';
import next from './next.js';
import now from './now.js';
import volumeUp from './volume-up.js';
import volumeDown from './volume-down.js';
import { macosPlugin } from '../../plugins/macos.js';

export default defineCommand({
  meta: {
    name: 'spotify',
    description: 'Control the Spotify application',
  },
  plugins: [macosPlugin],
  subCommands: {
    launch,
    play,
    pause,
    playpause,
    previous,
    next,
    now,
    'volume-up': volumeUp,
    'volume-down': volumeDown,
  },
});
