import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCommand } from 'citty';

vi.mock('@bitbard/core/network.js', () => ({
  getPortProcesses: vi.fn(),
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

describe('network port list', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('prints error for invalid port (NaN)', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['abc'] });

    expect(getPortProcesses).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid port'));
    logSpy.mockRestore();
  });

  it('prints error for port out of range (0)', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['0'] });

    expect(getPortProcesses).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid port'));
    logSpy.mockRestore();
  });

  it('prints error for port out of range (99999)', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['99999'] });

    expect(getPortProcesses).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid port'));
    logSpy.mockRestore();
  });

  it('prints dim message when no processes found', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['3000'] });

    expect(getPortProcesses).toHaveBeenCalledWith(3000);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No processes found on port 3000'));
    logSpy.mockRestore();
  });

  it('prints one row for a single process found', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([{ pid: 1234, name: 'node', socket: '*:3000' }]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['3000'] });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('1234'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('node'));
    logSpy.mockRestore();
  });

  it('prints one row per process for multiple processes found', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([
      { pid: 1234, name: 'node', socket: '*:3000' },
      { pid: 5678, name: 'python', socket: '*:3000' },
    ]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const listCmd = (await import('./list.js')).default;

    await runCommand(listCmd, { rawArgs: ['3000'] });

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('node'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('python'));
    logSpy.mockRestore();
  });
});
