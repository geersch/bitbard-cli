import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCommand } from 'citty';

vi.mock('@bitbard/core/network.js', () => ({
  getPortProcesses: vi.fn(),
  killProcess: vi.fn(),
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  log: {
    warn: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
  symbol: Symbol('clack:cancel'),
}));

const CANCEL = Symbol('clack:cancel');

describe('network port kill', () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('prints error for invalid port', async () => {
    const { killProcess } = await import('@bitbard/core/network.js');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['99999'] });

    expect(killProcess).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid port'));
    logSpy.mockRestore();
  });

  it('warns when no processes found', async () => {
    const { getPortProcesses } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([]);
    const { log } = await import('@clack/prompts');
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(log.warn).toHaveBeenCalledWith(expect.stringContaining('No processes found on port 3000'));
  });

  it('single process: user cancels confirm → exits cleanly', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([{ pid: 1234, name: 'node', socket: '*:3000' }]);
    const { confirm, isCancel } = await import('@clack/prompts');
    vi.mocked(confirm).mockResolvedValue(CANCEL);
    vi.mocked(isCancel).mockReturnValue(true);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(killProcess).not.toHaveBeenCalled();
  });

  it('single process: user confirms → killProcess called, log.success', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([{ pid: 1234, name: 'node', socket: '*:3000' }]);
    const { confirm, isCancel, log } = await import('@clack/prompts');
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(isCancel).mockReturnValue(false);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(killProcess).toHaveBeenCalledWith(1234);
    expect(log.success).toHaveBeenCalledWith(expect.stringContaining('node'));
  });

  it('single process: killProcess throws → log.error', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([{ pid: 1234, name: 'node', socket: '*:3000' }]);
    vi.mocked(killProcess).mockImplementation(() => {
      throw new Error('EPERM');
    });
    const { confirm, isCancel, log } = await import('@clack/prompts');
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(isCancel).mockReturnValue(false);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(log.error).toHaveBeenCalledWith(expect.stringContaining('EPERM'));
  });

  it('multiple processes: user cancels select → exits cleanly', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([
      { pid: 1234, name: 'node', socket: '*:3000' },
      { pid: 5678, name: 'python', socket: '*:3000' },
    ]);
    const { select, isCancel } = await import('@clack/prompts');
    vi.mocked(select).mockResolvedValue(CANCEL);
    vi.mocked(isCancel).mockReturnValue(true);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(killProcess).not.toHaveBeenCalled();
  });

  it('multiple processes: user cancels confirm → exits cleanly', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([
      { pid: 1234, name: 'node', socket: '*:3000' },
      { pid: 5678, name: 'python', socket: '*:3000' },
    ]);
    const { select, confirm, isCancel } = await import('@clack/prompts');
    vi.mocked(select).mockResolvedValue(1234);
    vi.mocked(confirm).mockResolvedValue(CANCEL);
    vi.mocked(isCancel).mockImplementation((v) => v === CANCEL);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(killProcess).not.toHaveBeenCalled();
  });

  it('multiple processes: user confirms → killProcess called, log.success', async () => {
    const { getPortProcesses, killProcess } = await import('@bitbard/core/network.js');
    vi.mocked(getPortProcesses).mockResolvedValue([
      { pid: 1234, name: 'node', socket: '*:3000' },
      { pid: 5678, name: 'python', socket: '*:3000' },
    ]);
    const { select, confirm, isCancel, log } = await import('@clack/prompts');
    vi.mocked(select).mockResolvedValue(1234);
    vi.mocked(confirm).mockResolvedValue(true);
    vi.mocked(isCancel).mockReturnValue(false);
    const killCmd = (await import('./kill.js')).default;

    await runCommand(killCmd, { rawArgs: ['3000'] });

    expect(killProcess).toHaveBeenCalledWith(1234);
    expect(log.success).toHaveBeenCalledWith(expect.stringContaining('node'));
  });
});
