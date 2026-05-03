import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exec } from 'node:child_process';
import { getSystemInfo } from './system-info.js';

vi.mock('node:child_process', () => ({
  exec: vi.fn(),
}));

vi.mock('node:os', () => ({
  default: {
    platform: vi.fn(() => 'darwin'),
    type: vi.fn(() => 'Darwin'),
    release: vi.fn(() => '24.4.0'),
    arch: vi.fn(() => 'arm64'),
    cpus: vi.fn(() => [{ model: 'Apple M3 Pro' }, { model: 'Apple M3 Pro' }]),
    totalmem: vi.fn(() => 16 * 1024 ** 3),
  },
}));

describe('getSystemInfo', () => {
  let originalVersions: NodeJS.ProcessVersions;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(async () => {
    originalVersions = process.versions;
    originalEnv = process.env;
    Object.defineProperty(process, 'versions', { value: { node: '22.14.0' }, configurable: true });
    process.env = { ...process.env, SHELL: '/bin/zsh' };
  });

  afterEach(() => {
    Object.defineProperty(process, 'versions', { value: originalVersions, configurable: true });
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  function mockExec(responses: Record<string, string | Error>) {
    vi.mocked(exec).mockImplementation((cmd, _opts, cb) => {
      const response = responses[cmd as string];
      if (cb) {
        if (response instanceof Error) {
          cb(response, '', '');
        } else {
          cb(null, response ?? '', '');
        }
      }
      return undefined as never;
    });
  }

  it('returns all fields when all tools are available', async () => {
    mockExec({
      'sw_vers -productName': 'macOS',
      'sw_vers -productVersion': '15.4.1',
      'git --version': 'git version 2.49.0',
      '/bin/zsh --version': 'zsh 5.9 (x86_64-apple-darwin)',
    });

    const info = await getSystemInfo('1.0.0');

    expect(info.bitbard).toBe('1.0.0');
    expect(info.os).toBe('macOS 15.4.1');
    expect(info.architecture).toBe('arm64');
    expect(info.cpus).toBe('Apple M3 Pro (2 cores)');
    expect(info.memory).toBe('16.00 GB');
    expect(info.node).toBe('22.14.0');
    expect(info.git).toBe('2.49.0');
    expect(info.shell).toBe('/bin/zsh (zsh 5.9 (x86_64-apple-darwin))');
  });

  it('falls back to kernel version on non-macOS platforms', async () => {
    const os = await import('node:os');
    vi.mocked(os.default.platform).mockReturnValueOnce('linux');
    vi.mocked(os.default.type).mockReturnValueOnce('Linux');
    vi.mocked(os.default.release).mockReturnValueOnce('6.8.0-51-generic');
    mockExec({});

    const info = await getSystemInfo('1.0.0');
    expect(info.os).toBe('Linux 6.8.0-51-generic');
  });

  it('reports "not found" for git when git is not installed', async () => {
    mockExec({
      'sw_vers -productName': 'macOS',
      'sw_vers -productVersion': '15.4.1',
      'git --version': new Error('git: command not found'),
      '/bin/zsh --version': 'zsh 5.9 (x86_64-apple-darwin)',
    });

    const info = await getSystemInfo('1.0.0');
    expect(info.git).toBe('not found');
  });

  it('reports "not found" for shell when $SHELL is not set', async () => {
    delete process.env.SHELL;
    mockExec({
      'sw_vers -productName': 'macOS',
      'sw_vers -productVersion': '15.4.1',
      'git --version': 'git version 2.49.0',
    });

    const info = await getSystemInfo('1.0.0');
    expect(info.shell).toBe('not found');
  });

  it('reports bare shell path when shell --version fails', async () => {
    mockExec({
      'sw_vers -productName': 'macOS',
      'sw_vers -productVersion': '15.4.1',
      'git --version': 'git version 2.49.0',
      '/bin/zsh --version': new Error('zsh: command not found'),
    });

    const info = await getSystemInfo('1.0.0');
    expect(info.shell).toBe('/bin/zsh');
  });
});
