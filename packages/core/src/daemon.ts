import * as net from 'node:net';
import { homedir } from 'node:os';
import { join } from 'node:path';

// ─── Types ────────────────────────────────────────────────────────────────────

type AudioDevicePayload =
  | { action: 'defaultInput' | 'defaultOutput' }
  | { action: 'mute' | 'unmute'; deviceId: number };

export type DaemonRequest =
  | { flux: { action: 'enable' | 'disable' | 'toggle' | 'status' } }
  | { truetone: { action: 'toggle' | 'status' } }
  | { lock: Record<string, never> }
  | { alert: { message: string; duration?: number } }
  | { audiodevice: AudioDevicePayload };

export interface DaemonResponse {
  ok: boolean;
  result?: unknown;
  error?: string;
}

export class DaemonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DaemonError';
  }
}

// ─── Client ───────────────────────────────────────────────────────────────────

function socketPath(): string {
  return process.env.BITBARD_SOCKET_PATH ?? join(homedir(), '.local', 'share', 'bitbard', 'bitbardd.sock');
}

export function sendCommand(request: DaemonRequest): Promise<DaemonResponse> {
  return new Promise((resolve, reject) => {
    const sock = socketPath();
    const conn = net.createConnection(sock);

    conn.once('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT' || err.code === 'ECONNREFUSED') {
        reject(
          new DaemonError(
            'bitbardd is not running. Start it with: launchctl load ~/Library/LaunchAgents/com.bitbard.bitbardd.plist',
          ),
        );
      } else {
        reject(new DaemonError(`bitbardd connection error: ${err.message}`));
      }
    });

    conn.once('connect', () => {
      conn.write(JSON.stringify(request) + '\n');
    });

    let buf = '';
    conn.on('data', (chunk) => {
      buf += chunk.toString();
      const nl = buf.indexOf('\n');
      if (nl !== -1) {
        conn.destroy();
        const line = buf.slice(0, nl);
        let parsed: DaemonResponse;
        try {
          parsed = JSON.parse(line) as DaemonResponse;
        } catch {
          reject(new DaemonError(`bitbardd: invalid response: ${line}`));
          return;
        }
        if (!parsed.ok) {
          reject(new DaemonError(parsed.error ?? 'bitbardd: unknown error'));
        } else {
          resolve(parsed);
        }
      }
    });
  });
}
