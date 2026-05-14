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
import login from './login.js';
import logout from './logout.js';
import { macosPlugin } from '../../plugins/macos.plugin.js';
import speakers from './speakers.js';
import speaker from './speaker.js';

export default defineCommand({
  meta: {
    name: 'spotify',
    description: 'Control the Spotify application',
  },
  plugins: [macosPlugin],
  subCommands: {
    login,
    logout,
    launch,
    play,
    pause,
    playpause,
    previous,
    speakers,
    speaker,
    next,
    now,
    'volume-up': volumeUp,
    'volume-down': volumeDown,
  },
});
