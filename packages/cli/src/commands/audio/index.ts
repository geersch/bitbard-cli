import { defineCommand } from 'citty';
import { macosPlugin } from '../../plugins/macos.js';
import input from './input/index.js';
import output from './output/index.js';

export default defineCommand({
  meta: {
    name: 'audio',
    description: 'Audio-related commands',
  },
  plugins: [macosPlugin],
  subCommands: {
    input,
    output,
  },
});
