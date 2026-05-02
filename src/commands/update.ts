import { defineCommand } from 'citty';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { chalk } from '../util/chalk.js';
import { spinner } from '../util/spinner.js';

const INSTALL_DIR = process.env.BITBARD_DIR ?? join(homedir(), '.bitbard');
const YARN = `node ${join(INSTALL_DIR, '.yarn/releases/yarn-4.14.1.cjs')}`;

function run(cmd: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err) => (err ? reject(err) : resolve()));
  });
}

function getOutput(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, encoding: 'utf8' }, (err, stdout) => (err ? reject(err) : resolve(stdout.trim())));
  });
}

export default defineCommand({
  meta: {
    name: 'update',
    description: 'Update bitbard CLI to the latest version',
  },
  async run() {
    if (!existsSync(join(INSTALL_DIR, '.git'))) {
      console.error(
        `Error: bitbard installation not found at ${INSTALL_DIR}.\n` +
          'Re-install bitbard using the install script and try again.',
      );
      process.exit(1);
    }

    let stop = spinner('Checking for updates');
    await run('git fetch --depth=1 origin HEAD', INSTALL_DIR);

    const [localHash, remoteHash] = await Promise.all([
      getOutput('git rev-parse HEAD', INSTALL_DIR),
      getOutput('git rev-parse FETCH_HEAD', INSTALL_DIR),
    ]);

    if (localHash === remoteHash) {
      stop('Already up to date');
      return;
    }

    await run('git reset --hard FETCH_HEAD', INSTALL_DIR);
    stop('Update found');

    stop = spinner('Installing dependencies');
    await run(`${YARN} install`, INSTALL_DIR);
    stop('Dependencies installed');

    stop = spinner('Building');
    await run(`${YARN} build`, INSTALL_DIR);
    stop('Build complete');

    await run(`chmod a+x ${join(INSTALL_DIR, 'dist/bitbard.js')}`, INSTALL_DIR);

    console.log(chalk.bold(chalk.green('\nbitbard updated successfully.')));
  },
});
