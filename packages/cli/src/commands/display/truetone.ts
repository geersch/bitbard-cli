import { defineCommand } from 'citty';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';

const binDir = process.env.BITBARD_BIN_DIR ?? join(homedir(), '.local', 'share', 'bitbard', 'bin');
const BINARY = join(binDir, 'truetone');

export default defineCommand({
  meta: {
    name: 'truetone',
    description: 'Toggle macOS True Tone.',
  },
  run() {
    if (!isMacOS()) {
      console.log(chalk.bold(chalk.red('The truetone command is only supported on macOS.')));
      return;
    }

    try {
      const result = execFileSync(BINARY, ['toggle'], { encoding: 'utf8' }).trim();
      if (result === 'enabled') {
        console.log(chalk.bold(chalk.green('True Tone enabled.')));
      } else {
        console.log(chalk.bold(chalk.yellow('True Tone disabled.')));
      }
    } catch (err) {
      console.log(chalk.bold(chalk.red(`Failed to toggle True Tone: ${(err as Error).message}`)));
    }
  },
});
