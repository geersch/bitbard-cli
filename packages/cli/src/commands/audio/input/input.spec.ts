import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCommand } from 'citty';
import muteCmd from './mute.js';
import unmuteCmd from './unmute.js';
import statusCmd from './status.js';

vi.mock('@bitbard/core/audiodevice.js', () => ({
  AudioDevice: {
    defaultInput: vi.fn().mockResolvedValue({
      id: 67,
      name: 'MacBook Pro Microphone',
      isInput: true,
      isOutput: false,
      isMuted: false,
      mute: vi.fn().mockResolvedValue(undefined),
      unmute: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

describe('audio input mute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mutes the default input device', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');

    await runCommand(muteCmd, { rawArgs: [] });

    expect(AudioDevice.defaultInput).toHaveBeenCalledOnce();
    const device = await AudioDevice.defaultInput();
    expect(device!.mute).toHaveBeenCalled();
  });

  it('logs an error when no default input device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultInput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(muteCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default input device found'));
    consoleSpy.mockRestore();
  });

  it('exits when not on macOS', async () => {
    const { isMacOS } = await import('@bitbard/core/platform.js');
    vi.mocked(isMacOS).mockReturnValueOnce(false);
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('exit');
    });

    await expect(runCommand(muteCmd, { rawArgs: [] })).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
  });
});

describe('audio input unmute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unmutes the default input device', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');

    await runCommand(unmuteCmd, { rawArgs: [] });

    expect(AudioDevice.defaultInput).toHaveBeenCalledOnce();
    const device = await AudioDevice.defaultInput();
    expect(device!.unmute).toHaveBeenCalled();
  });

  it('logs an error when no default input device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultInput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(unmuteCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default input device found'));
    consoleSpy.mockRestore();
  });
});

describe('audio input status', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prints the default input device name', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(AudioDevice.defaultInput).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MacBook Pro Microphone'));
    consoleSpy.mockRestore();
  });

  it('shows muted status when device is muted', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultInput).mockResolvedValueOnce({
      id: 67,
      name: 'MacBook Pro Microphone',
      isInput: true,
      isOutput: false,
      isMuted: true,
      mute: vi.fn().mockResolvedValue(undefined),
      unmute: vi.fn().mockResolvedValue(undefined),
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('muted'));
    consoleSpy.mockRestore();
  });

  it('logs an error when no default input device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultInput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default input device found'));
    consoleSpy.mockRestore();
  });
});
