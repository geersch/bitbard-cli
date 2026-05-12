import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from 'citty';

vi.mock('@bitbard/core/daemon.js', () => ({
  sendCommand: vi.fn().mockResolvedValue({ ok: true, result: 'enabled' }),
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

describe('flux command', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('calls sendCommand with flux toggle', async () => {
    const { sendCommand } = await import('@bitbard/core/daemon.js');
    const fluxCmd = (await import('./flux.js')).default;

    await runCommand(fluxCmd, { rawArgs: [] });

    expect(sendCommand).toHaveBeenCalledWith({ flux: { action: 'toggle' } });
  });

  it('prints enabled message when result is enabled', async () => {
    const { sendCommand } = await import('@bitbard/core/daemon.js');
    vi.mocked(sendCommand).mockResolvedValueOnce({ ok: true, result: 'enabled' });
    const fluxCmd = (await import('./flux.js')).default;

    await runCommand(fluxCmd, { rawArgs: [] });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('enabled'));
  });

  it('prints disabled message when result is disabled', async () => {
    const { sendCommand } = await import('@bitbard/core/daemon.js');
    vi.mocked(sendCommand).mockResolvedValueOnce({ ok: true, result: 'disabled' });
    const fluxCmd = (await import('./flux.js')).default;

    await runCommand(fluxCmd, { rawArgs: [] });

    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('disabled'));
  });
});
