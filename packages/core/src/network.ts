import { execFile } from 'node:child_process';
import os from 'node:os';

export function getLocalIp(): string | null {
  const interfaces = os.networkInterfaces();

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

export type PortProcess = {
  pid: number;
  name: string;
  socket: string;
};

export function getPortProcesses(port: number): Promise<PortProcess[]> {
  return new Promise((resolve, reject) => {
    execFile('lsof', [`-iTCP:${port}`, '-sTCP:LISTEN', '-n', '-P'], (err, stdout) => {
      if (err) {
        // lsof exits with code 1 when no matches — not a real error
        // .code can be a number or string depending on Node internals
        if (Number((err as NodeJS.ErrnoException).code) === 1) {
          resolve([]);
          return;
        }
        reject(err);
        return;
      }

      const lines = stdout.trim().split('\n');
      const seen = new Set<number>();
      const results: PortProcess[] = [];

      for (const line of lines) {
        // Skip header row
        if (line.trimStart().startsWith('COMMAND')) continue;

        const cols = line.trim().split(/\s+/);
        // lsof output has 9+ columns; fewer means a malformed/unexpected line
        if (cols.length < 9) continue;

        const name = cols[0];
        const pid = parseInt(cols[1], 10);
        // NAME column is e.g. "*:3000 (LISTEN)"; take the second-to-last col
        const last = cols[cols.length - 1];
        const socket = last === '(LISTEN)' ? cols[cols.length - 2] : last;

        if (isNaN(pid) || seen.has(pid)) continue;
        seen.add(pid);
        results.push({ pid, name, socket });
      }

      resolve(results);
    });
  });
}

export function killProcess(pid: number): void {
  process.kill(pid, 'SIGTERM');
}

export async function getPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org', {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const text = await res.text();
    return text.trim();
  } catch {
    return null;
  }
}
