import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'node:net';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

// We test sendCommand by spinning up a real Unix socket server in the test.

describe('sendCommand', () => {
  let sockPath: string;
  let server: net.Server;

  beforeEach(async () => {
    sockPath = path.join(os.tmpdir(), `bitbardd-test-${process.pid}.sock`);
    try {
      fs.unlinkSync(sockPath);
    } catch {}
    process.env.BITBARD_SOCKET_PATH = sockPath;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
    try {
      fs.unlinkSync(sockPath);
    } catch {}
    delete process.env.BITBARD_SOCKET_PATH;
    vi.resetModules();
  });

  function startMockServer(response: object): Promise<void> {
    return new Promise((resolve) => {
      server = net.createServer((conn) => {
        let buf = '';
        conn.setEncoding('utf8');
        conn.on('data', (chunk) => {
          buf += chunk;
          if (buf.includes('\n')) {
            conn.write(JSON.stringify(response) + '\n');
            conn.end();
          }
        });
      });
      server.listen(sockPath, () => resolve());
    });
  }

  it('resolves with result when ok:true', async () => {
    await startMockServer({ ok: true, result: 'disabled' });
    const { sendCommand } = await import('./daemon.js');

    const res = await sendCommand({ flux: { action: 'status' } });
    expect(res).toEqual({ ok: true, result: 'disabled' });
  });

  it('throws DaemonError when ok:false', async () => {
    await startMockServer({ ok: false, error: 'flux: unknown action' });
    const { sendCommand } = await import('./daemon.js');

    await expect(sendCommand({ flux: { action: 'bad' as never } })).rejects.toThrow('flux: unknown action');
  });

  it('throws with helpful message when socket does not exist', async () => {
    const { sendCommand } = await import('./daemon.js');

    await expect(sendCommand({ lock: {} })).rejects.toThrow('bitbardd is not running');
  });

  it('sends the request as newline-terminated JSON', async () => {
    let received = '';
    await new Promise<void>((resolve) => {
      server = net.createServer((conn) => {
        conn.setEncoding('utf8');
        conn.on('data', (chunk) => {
          received += chunk;
          if (received.includes('\n')) {
            conn.write(JSON.stringify({ ok: true, result: 'ok' }) + '\n');
            conn.end();
          }
        });
      });
      server.listen(sockPath, () => resolve());
    });

    const { sendCommand } = await import('./daemon.js');
    await sendCommand({ lock: {} });

    expect(received.trimEnd()).toBe(JSON.stringify({ lock: {} }));
  });

  it('passes through an object result as-is', async () => {
    const deviceData = { id: 67, name: 'MacBook Pro Microphone', isInput: true, isOutput: false };
    await startMockServer({ ok: true, result: deviceData });
    const { sendCommand } = await import('./daemon.js');

    const res = await sendCommand({ audiodevice: { action: 'defaultInput' } });
    expect(res).toEqual({ ok: true, result: deviceData });
  });
});
