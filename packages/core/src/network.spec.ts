import { describe, it, expect, vi, afterEach } from 'vitest';
import { getLocalIp, getPublicIp } from './network.js';

vi.mock('node:os', () => ({
  default: {
    networkInterfaces: vi.fn(),
  },
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
