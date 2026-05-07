import { defineCommand } from 'citty';
import chalk from 'chalk';
import { getNowPlaying } from '@bitbard/core/spotify.js';

export default defineCommand({
  meta: {
    name: 'now',
    description: 'Display the currently playing artist and track',
  },
  async run() {
    const nowPlaying = await getNowPlaying();

    if (!nowPlaying) {
      console.log(chalk.dim('Nothing playing.'));
      return;
    }

    const artist = chalk.bold(chalk.cyan(nowPlaying.artist));
    const track = chalk.bold(chalk.white(nowPlaying.track));
    const album = nowPlaying.album ? ` ${chalk.dim(`(${nowPlaying.album})`)}` : '';

    console.log(`${artist} - ${track}${album}`);
  },
});
