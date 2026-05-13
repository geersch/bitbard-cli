import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as net from 'node:net';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

describe('AudioDevice', () => {
  let sockPath: string;
  let server: net.Server;

  beforeEach(async () => {
    sockPath = path.join(os.tmpdir(), `bitbardd-test-audio-${process.pid}.sock`);
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

  function startCapturingServer(response: object): Promise<() => string> {
    let received = '';
    return new Promise((resolve) => {
      server = net.createServer((conn) => {
        conn.setEncoding('utf8');
        conn.on('data', (chunk) => {
          received += chunk;
          if (received.includes('\n')) {
            conn.write(JSON.stringify(response) + '\n');
            conn.end();
          }
        });
      });
      server.listen(sockPath, () => resolve(() => received.trimEnd()));
    });
  }

  it('defaultInput() returns an AudioDevice with correct properties', async () => {
    const deviceData = { id: 67, name: 'MacBook Pro Microphone', isInput: true, isOutput: false, isMuted: false };
    await startMockServer({ ok: true, result: deviceData });
    const { AudioDevice } = await import('./audiodevice.js');

    const device = await AudioDevice.defaultInput();
    expect(device).not.toBeNull();
    expect(device!.id).toBe(67);
    expect(device!.name).toBe('MacBook Pro Microphone');
    expect(device!.isInput).toBe(true);
    expect(device!.isOutput).toBe(false);
    expect(device!.isMuted).toBe(false);
  });

  it('defaultInput() returns an AudioDevice with isMuted true when muted', async () => {
    const deviceData = { id: 67, name: 'MacBook Pro Microphone', isInput: true, isOutput: false, isMuted: true };
    await startMockServer({ ok: true, result: deviceData });
    const { AudioDevice } = await import('./audiodevice.js');

    const device = await AudioDevice.defaultInput();
    expect(device).not.toBeNull();
    expect(device!.isMuted).toBe(true);
  });

  it('defaultOutput() returns an AudioDevice with correct properties', async () => {
    const deviceData = { id: 72, name: 'MacBook Pro Speakers', isInput: false, isOutput: true, isMuted: false };
    await startMockServer({ ok: true, result: deviceData });
    const { AudioDevice } = await import('./audiodevice.js');

    const device = await AudioDevice.defaultOutput();
    expect(device).not.toBeNull();
    expect(device!.id).toBe(72);
    expect(device!.name).toBe('MacBook Pro Speakers');
    expect(device!.isInput).toBe(false);
    expect(device!.isOutput).toBe(true);
    expect(device!.isMuted).toBe(false);
  });

  it('defaultInput() returns null when daemon returns no device error', async () => {
    await startMockServer({ ok: false, error: 'audiodevice: no default input device' });
    const { AudioDevice } = await import('./audiodevice.js');

    const device = await AudioDevice.defaultInput();
    expect(device).toBeNull();
  });

  it('defaultInput() returns null when socket does not exist (daemon not running)', async () => {
    const { AudioDevice } = await import('./audiodevice.js');

    const device = await AudioDevice.defaultInput();
    expect(device).toBeNull();
  });

  it('mute() sends the correct request to the daemon', async () => {
    const deviceData = { id: 67, name: 'MacBook Pro Microphone', isInput: true, isOutput: false, isMuted: false };
    await startCapturingServer({ ok: true, result: deviceData });
    const { AudioDevice } = await import('./audiodevice.js');
    const device = await AudioDevice.defaultInput();

    await new Promise<void>((resolve) => server.close(() => resolve()));
    const getMuteReceived = await startCapturingServer({ ok: true, result: 'ok' });

    await device!.mute();
    expect(getMuteReceived()).toBe(JSON.stringify({ audiodevice: { action: 'mute', deviceId: 67 } }));
  });

  it('unmute() sends the correct request to the daemon', async () => {
    const deviceData = { id: 67, name: 'MacBook Pro Microphone', isInput: true, isOutput: false, isMuted: true };
    await startCapturingServer({ ok: true, result: deviceData });
    const { AudioDevice } = await import('./audiodevice.js');
    const device = await AudioDevice.defaultInput();

    await new Promise<void>((resolve) => server.close(() => resolve()));
    const getReceived = await startCapturingServer({ ok: true, result: 'ok' });

    await device!.unmute();
    expect(getReceived()).toBe(JSON.stringify({ audiodevice: { action: 'unmute', deviceId: 67 } }));
  });
});
