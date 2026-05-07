import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from 'citty';
import infoCmd from './info.js';

vi.mock('@bitbard/core/system-info.js', () => ({
  getSystemInfo: vi.fn(() => ({
    bitbard: '1.0.0',
    os: 'Darwin 24.4.0',
    architecture: 'arm64',
    cpus: 'Apple M3 Pro (11 cores)',
    memory: '18.00 GB',
    node: '22.14.0',
    git: '2.49.0',
    shell: '/bin/zsh (zsh 5.9)',
  })),
}));

describe('info command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('prints all system info fields', async () => {
    await runCommand(infoCmd, { rawArgs: [] });

    expect(logSpy).toHaveBeenCalledWith('  bitbard:          1.0.0');
    expect(logSpy).toHaveBeenCalledWith('  OS:               Darwin 24.4.0');
    expect(logSpy).toHaveBeenCalledWith('  Architecture:     arm64');
    expect(logSpy).toHaveBeenCalledWith('  CPUs:             Apple M3 Pro (11 cores)');
    expect(logSpy).toHaveBeenCalledWith('  Memory:           18.00 GB');
    expect(logSpy).toHaveBeenCalledWith('  Node:             22.14.0');
    expect(logSpy).toHaveBeenCalledWith('  Git:              2.49.0');
    expect(logSpy).toHaveBeenCalledWith('  Shell:            /bin/zsh (zsh 5.9)');
  });

  it('shows "not found" for git when git is not installed', async () => {
    const { getSystemInfo } = await import('@bitbard/core/system-info.js');
    vi.mocked(getSystemInfo).mockResolvedValueOnce({
      bitbard: '1.0.0',
      os: 'Darwin 24.4.0',
      architecture: 'arm64',
      cpus: 'Apple M3 Pro (11 cores)',
      memory: '18.00 GB',
      node: '22.14.0',
      git: 'not found',
      shell: '/bin/zsh (zsh 5.9)',
    });

    await runCommand(infoCmd, { rawArgs: [] });

    expect(logSpy).toHaveBeenCalledWith('  Git:              not found');
  });
});
