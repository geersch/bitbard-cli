import { defineCommand } from 'citty';
import { mkdtempSync, renameSync, cpSync, chmodSync, mkdirSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { intro, outro, log, spinner } from '@clack/prompts';

const GITHUB_REPO = 'geersch/bitbard-cli';
const API_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export default defineCommand({
  meta: {
    name: 'upgrade',
    description: 'Upgrade bitbard to the latest release',
  },
  async run() {
    intro('Upgrade');

    // -------------------------------------------------------------------------
    // Check for updates
    // -------------------------------------------------------------------------

    const platform = process.platform === 'darwin' ? 'darwin' : process.platform;
    const arch = process.arch === 'x64' ? 'x64' : process.arch;
    const combo = `${platform}-${arch}`;

    const s = spinner();
    s.start('Checking for updates…');

    const res = await fetch(API_URL);

    if (res.status === 404) {
      s.stop('No releases available yet');
      outro('Nothing to do');
      return;
    }

    if (!res.ok) {
      s.stop('');
      log.error(`Failed to check for updates (HTTP ${res.status})`);
      process.exit(1);
    }

    const data = (await res.json()) as { tag_name: string };
    const latestVersion = data.tag_name.replace(/^v/, '');

    if (latestVersion === __APP_VERSION__) {
      s.stop(`Already up to date (${__APP_VERSION__})`);
      outro('Done');
      return;
    }

    s.stop(`Update available: ${__APP_VERSION__} → ${latestVersion}`);

    // -------------------------------------------------------------------------
    // Download
    // -------------------------------------------------------------------------

    const assetName = `bitbard-${combo}.tar.gz`;
    const downloadUrl = `https://github.com/${GITHUB_REPO}/releases/download/v${latestVersion}/${assetName}`;

    const s2 = spinner();
    s2.start('Downloading…');

    const dlRes = await fetch(downloadUrl);
    if (!dlRes.ok) {
      s2.stop('');
      log.error(`Failed to download release (HTTP ${dlRes.status})`);
      process.exit(1);
    }

    const tmpDir = mkdtempSync(join(tmpdir(), 'bitbard-upgrade-'));
    const archivePath = join(tmpDir, assetName);
    const arrayBuffer = await dlRes.arrayBuffer();
    writeFileSync(archivePath, Buffer.from(arrayBuffer));

    s2.stop('Downloaded');

    // -------------------------------------------------------------------------
    // Install
    // -------------------------------------------------------------------------

    const s3 = spinner();
    s3.start('Installing…');

    execSync(`tar -xzf "${archivePath}" -C "${tmpDir}"`);

    // Replace main binary atomically
    const newBinary = join(tmpDir, 'bitbard');
    renameSync(newBinary, process.execPath);
    chmodSync(process.execPath, 0o755);

    // Replace Swift helpers if present
    const newBinDir = join(tmpDir, 'bin');
    if (existsSync(newBinDir)) {
      mkdirSync(__BIN_DIR__, { recursive: true });
      cpSync(newBinDir, __BIN_DIR__, { recursive: true, force: true });
      chmodSync(__BIN_DIR__, 0o755);
    }

    s3.stop('Installed');

    outro(`Updated to ${latestVersion}`);
  },
});
