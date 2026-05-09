import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCommand } from 'citty';
import lockCmd from './lock.js';

vi.mock('@bitbard/core/caffeinate.js', () => ({
  lockScreen: vi.fn(),
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

describe('lock command', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls lockScreen when run', async () => {
    const { lockScreen } = await import('@bitbard/core/caffeinate.js');

    await runCommand(lockCmd, { rawArgs: [] });

    expect(lockScreen).toHaveBeenCalledOnce();
  });

  it('exits when not on macOS', async () => {
    const { isMacOS } = await import('@bitbard/core/platform.js');
    vi.mocked(isMacOS).mockReturnValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(runCommand(lockCmd, { rawArgs: [] })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});
