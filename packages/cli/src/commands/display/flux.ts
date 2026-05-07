import { defineCommand } from 'citty';
import { execSync, spawn } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import chalk from 'chalk';
import { isMacOS } from '@bitbard/core/platform.js';

const STATE_DIR = join(homedir(), '.config', 'bitbard');
const STATE_FILE = join(STATE_DIR, 'flux.json');

const binDir = process.env.BITBARD_BIN_DIR ?? join(homedir(), '.local', 'share', 'bitbard', 'bin');
const BINARY = join(binDir, 'flux');

interface State {
  enabled: boolean;
  pid?: number;
}

function readState(): State {
  if (!existsSync(STATE_FILE)) return { enabled: false };
  try {
    return JSON.parse(readFileSync(STATE_FILE, 'utf8')) as State;
  } catch {
    return { enabled: false };
  }
}

function writeState(state: State): void {
  mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(state), 'utf8');
}

function enable(): number {
  const child = spawn(BINARY, ['enable'], {
    detached: true,
    stdio: 'ignore',
  });
  child.unref();
  return child.pid!;
}

function disable(pid?: number): void {
  // Kill the daemon if we have its PID
  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // already gone
    }
  }
  // Also restore gamma via the binary (handles CGDisplayRestoreColorSyncSettings)
  try {
    execSync(`"${BINARY}" disable`, { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

export default defineCommand({
  meta: {
    name: 'flux',
    description: 'Toggle warm screen tint (reduces blue light)',
  },
  run() {
    if (!isMacOS()) {
      console.log(chalk.bold(chalk.red('The flux command is only supported on macOS.')));
      return;
    }

    const state = readState();

    if (state.enabled) {
      disable(state.pid);
      writeState({ enabled: false });
      console.log(chalk.bold(chalk.green('Screen tint disabled.')));
    } else {
      const pid = enable();
      writeState({ enabled: true, pid });
      console.log(chalk.bold(chalk.yellow('Screen tint enabled.')));
    }
  },
});
