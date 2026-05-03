import { exec } from 'node:child_process';
import os from 'node:os';
import { isMacOS } from './platform.js';

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

function tryExec(cmd: string): Promise<string | undefined> {
  return new Promise((resolve) => {
    exec(cmd, { encoding: 'utf8' }, (err, stdout) => resolve(err ? undefined : stdout.trim()));
  });
}

function formatMemory(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

async function getMacOSVersion(): Promise<string> {
  const [name, version] = await Promise.all([tryExec('sw_vers -productName'), tryExec('sw_vers -productVersion')]);
  return `${name} ${version}`;
}

async function getOsVersion(): Promise<string> {
  if (isMacOS()) {
    return getMacOSVersion();
  }
  return `${os.type()} ${os.release()}`;
}

async function getShell(): Promise<string | undefined> {
  const shellPath = process.env.SHELL;
  if (!shellPath) {
    return;
  }

  const version = await tryExec(`${shellPath} --version`);
  if (!version) {
    return shellPath;
  }

  const firstLine = version.split('\n')[0];
  return `${shellPath} (${firstLine})`;
}

export async function getSystemInfo(bitbardVersion: string): Promise<SystemInfo> {
  const cpuList = os.cpus();
  const cpuModel = cpuList.length > 0 ? cpuList[0].model : 'unknown';

  const [osVersion, shellInfo, rawGit] = await Promise.all([getOsVersion(), getShell(), tryExec('git --version')]);

  const gitVersion = rawGit ? rawGit.replace(/^git version\s+/, '') : 'not found';

  return {
    bitbard: bitbardVersion,
    os: osVersion,
    architecture: os.arch(),
    cpus: `${cpuModel} (${cpuList.length} cores)`,
    memory: formatMemory(os.totalmem()),
    node: process.versions.node,
    git: gitVersion,
    shell: shellInfo ?? 'not found',
  };
}
