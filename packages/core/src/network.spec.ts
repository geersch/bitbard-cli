import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLocalIp, getPublicIp, getPortProcesses, killProcess } from './network.js';

vi.mock('node:os', () => ({
  default: {
    networkInterfaces: vi.fn(),
  },
}));

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}));

describe('getLocalIp', () => {
  afterEach(() => {
    vi.clearAllMocks(); // resets call counts on vi.mock stubs
  });

  it('returns the first non-loopback IPv4 address', async () => {
    const os = await import('node:os');
    vi.mocked(os.default.networkInterfaces).mockReturnValue({
      lo0: [
        {
          address: '127.0.0.1',
          family: 'IPv4',
          internal: true,
          netmask: '255.0.0.0',
          mac: '00:00:00:00:00:00',
          cidr: '127.0.0.1/8',
        },
      ],
      en0: [
        {
          address: 'fe80::1',
          family: 'IPv6',
          internal: false,
          netmask: 'ffff::',
          mac: 'aa:bb:cc:dd:ee:ff',
          cidr: 'fe80::1/64',
          scopeid: 4,
        },
        {
          address: '192.168.1.42',
          family: 'IPv4',
          internal: false,
          netmask: '255.255.255.0',
          mac: 'aa:bb:cc:dd:ee:ff',
          cidr: '192.168.1.42/24',
        },
      ],
    });

    expect(getLocalIp()).toBe('192.168.1.42');
  });

  it('returns null when all interfaces are loopback', async () => {
    const os = await import('node:os');
    vi.mocked(os.default.networkInterfaces).mockReturnValue({
      lo0: [
        {
          address: '127.0.0.1',
          family: 'IPv4',
          internal: true,
          netmask: '255.0.0.0',
          mac: '00:00:00:00:00:00',
          cidr: '127.0.0.1/8',
        },
      ],
    });

    expect(getLocalIp()).toBeNull();
  });

  it('returns null when networkInterfaces returns empty object', async () => {
    const os = await import('node:os');
    vi.mocked(os.default.networkInterfaces).mockReturnValue({});

    expect(getLocalIp()).toBeNull();
  });
});

describe('getPublicIp', () => {
  afterEach(() => {
    vi.restoreAllMocks(); // restores original fetch after vi.spyOn
  });

  it('returns the trimmed response body on success', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('203.0.113.7\n', { status: 200 }));

    expect(await getPublicIp()).toBe('203.0.113.7');
  });

  it('returns null on non-OK response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('error', { status: 503 }));

    expect(await getPublicIp()).toBeNull();
  });

  it('returns null on network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('network failure'));

    expect(await getPublicIp()).toBeNull();
  });

  it('returns null on timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new DOMException('The operation was aborted.', 'AbortError'));

    expect(await getPublicIp()).toBeNull();
  });
});

describe('getPortProcesses', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns parsed processes from lsof output', async () => {
    const { execFile } = await import('node:child_process');
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(
        null,
        [
          'COMMAND    PID    USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME',
          'node      1234 user    9u  IPv4   0x1234      0t0  TCP *:3000 (LISTEN)',
          'node      1234 user   10u  IPv6   0x5678      0t0  TCP *:3000 (LISTEN)',
        ].join('\n'),
        '',
      );
      return {} as any;
    });

    const result = await getPortProcesses(3000);

    expect(result).toEqual([{ pid: 1234, name: 'node', socket: '*:3000' }]);
  });

  it('returns empty array when lsof finds nothing (exit code string "1")', async () => {
    const { execFile } = await import('node:child_process');
    const err = Object.assign(new Error('no matches'), { code: '1' });
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(err, '', '');
      return {} as any;
    });

    const result = await getPortProcesses(3000);

    expect(result).toEqual([]);
  });

  it('returns empty array when lsof finds nothing (exit code numeric 1)', async () => {
    const { execFile } = await import('node:child_process');
    const err = Object.assign(new Error('no matches'), { code: 1 });
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(err, '', '');
      return {} as any;
    });

    const result = await getPortProcesses(3000);

    expect(result).toEqual([]);
  });

  it('returns empty array when lsof output is empty', async () => {
    const { execFile } = await import('node:child_process');
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(null, '', '');
      return {} as any;
    });

    const result = await getPortProcesses(3000);

    expect(result).toEqual([]);
  });

  it('throws on unexpected exec error (e.g. lsof not found)', async () => {
    const { execFile } = await import('node:child_process');
    const err = Object.assign(new Error('spawn lsof ENOENT'), { code: 'ENOENT' });
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(err, '', '');
      return {} as any;
    });

    await expect(getPortProcesses(3000)).rejects.toThrow('spawn lsof ENOENT');
  });
});

describe('killProcess', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends SIGTERM to the given PID', () => {
    const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true);

    killProcess(1234);

    expect(killSpy).toHaveBeenCalledWith(1234, 'SIGTERM');
  });

  it('throws when process.kill throws (e.g. EPERM)', () => {
    vi.spyOn(process, 'kill').mockImplementation(() => {
      throw Object.assign(new Error('EPERM'), { code: 'EPERM' });
    });

    expect(() => killProcess(1234)).toThrow('EPERM');
  });
});
