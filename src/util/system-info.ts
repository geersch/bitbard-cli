import { execSync } from 'node:child_process';
import os from 'node:os';

export interface SystemInfo {
  bitbard: string;
  os: string;
  architecture: string;
  cpus: string;
  memory: string;
  node: string;
  git: string;
  shell: string;
}

function tryExec(cmd: string): string | undefined {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch {
    return undefined;
  }
}

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function getOsVersion(): string {
  const type = os.type();
  if (type === 'Darwin') {
    const name = tryExec('sw_vers -productName');
    const version = tryExec('sw_vers -productVersion');
    if (name !== undefined && version !== undefined) {
      return `${name} ${version}`;
    }
  }
  return `${type} ${os.release()}`;
}

function getShell(): string | undefined {
  const shellPath = process.env.SHELL;
  if (!shellPath) {
    return;
  }

  const version = tryExec(`${shellPath} --version`);
  if (!version) {
    return shellPath;
  }

  const firstLine = version.split('\n')[0];
  return `${shellPath} (${firstLine})`;
}

export function getSystemInfo(bitbardVersion: string): SystemInfo {
  const cpuList = os.cpus();
  const cpuModel = cpuList.length > 0 ? cpuList[0].model : 'unknown';

  const rawGit = tryExec('git --version');
  const gitVersion = rawGit ? rawGit.replace(/^git version\s+/, '') : 'not found';

  return {
    bitbard: bitbardVersion,
    os: getOsVersion(),
    architecture: os.arch(),
    cpus: `${cpuModel} (${cpuList.length} cores)`,
    memory: formatMemory(os.totalmem()),
    node: process.versions.node,
    git: gitVersion,
    shell: getShell() ?? 'not found',
  };
}
