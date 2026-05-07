import { defineCommand } from 'citty';
import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { intro, outro, log, spinner } from '../util/ui.js';

const INSTALL_DIR = process.env.BITBARD_DIR ?? join(homedir(), '.bitbard');
const YARN = `node ${join(INSTALL_DIR, '.yarn/releases/yarn-4.14.1.cjs')}`;

export default defineCommand({
  meta: {
    name: 'upgrade',
    description: 'Upgrade bitbard CLI to the latest version',
  },
  async run() {
    if (!existsSync(join(INSTALL_DIR, '.git'))) {
      log.error(
        `bitbard installation not found at ${INSTALL_DIR}.\n` +
          'Re-install bitbard using the install script and try again.',
      );
      process.exit(1);
    }

    intro('Upgrade');

    const s = spinner();
    s.start('Checking for updates…');
    await execCmd('git fetch --depth=1 origin HEAD', INSTALL_DIR);

    const [localHash, remoteHash] = await Promise.all([
      getOutput('git rev-parse HEAD', INSTALL_DIR),
      getOutput('git rev-parse FETCH_HEAD', INSTALL_DIR),
    ]);

    if (localHash === remoteHash) {
      s.stop('Already up to date');
      outro('Done');
      return;
    }

    await execCmd('git reset --hard FETCH_HEAD', INSTALL_DIR);
    s.stop('Update found');

    const s2 = spinner();
    s2.start('Installing dependencies…');
    await execCmd(`${YARN} install`, INSTALL_DIR);
    s2.stop('Dependencies installed');

    const s3 = spinner();
    s3.start('Building…');
    await execCmd(`${YARN} build`, INSTALL_DIR);
    s3.stop('Build complete');

    await execCmd(`chmod a+x ${join(INSTALL_DIR, 'dist/bitbard.js')}`, INSTALL_DIR);

    outro('Done');
  },
});

function execCmd(cmd: string, cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd }, (err) => (err ? reject(err) : resolve()));
  });
}

function getOutput(cmd: string, cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, { cwd, encoding: 'utf8' }, (err, stdout) => (err ? reject(err) : resolve(stdout.trim())));
  });
}
