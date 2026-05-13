import { describe, it, expect, vi, afterEach } from 'vitest';
import { runCommand } from 'citty';
import muteCmd from './mute.js';
import unmuteCmd from './unmute.js';
import statusCmd from './status.js';

vi.mock('@bitbard/core/audiodevice.js', () => ({
  AudioDevice: {
    defaultOutput: vi.fn().mockResolvedValue({
      id: 72,
      name: 'MacBook Pro Speakers',
      isInput: false,
      isOutput: true,
      isMuted: false,
      mute: vi.fn().mockResolvedValue(undefined),
      unmute: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

describe('audio output mute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('mutes the default output device', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');

    await runCommand(muteCmd, { rawArgs: [] });

    expect(AudioDevice.defaultOutput).toHaveBeenCalledOnce();
    const device = await AudioDevice.defaultOutput();
    expect(device!.mute).toHaveBeenCalled();
  });

  it('logs an error when no default output device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultOutput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(muteCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default output device found'));
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

describe('audio output unmute', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('unmutes the default output device', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');

    await runCommand(unmuteCmd, { rawArgs: [] });

    expect(AudioDevice.defaultOutput).toHaveBeenCalledOnce();
    const device = await AudioDevice.defaultOutput();
    expect(device!.unmute).toHaveBeenCalled();
  });

  it('logs an error when no default output device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultOutput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(unmuteCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default output device found'));
    consoleSpy.mockRestore();
  });
});

describe('audio output status', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('prints the default output device name and active status', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(AudioDevice.defaultOutput).toHaveBeenCalledOnce();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('MacBook Pro Speakers'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('active'));
    consoleSpy.mockRestore();
  });

  it('shows muted status when device is muted', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultOutput).mockResolvedValueOnce({
      id: 72,
      name: 'MacBook Pro Speakers',
      isInput: false,
      isOutput: true,
      isMuted: true,
      mute: vi.fn().mockResolvedValue(undefined),
      unmute: vi.fn().mockResolvedValue(undefined),
    });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('muted'));
    consoleSpy.mockRestore();
  });

  it('logs an error when no default output device is found', async () => {
    const { AudioDevice } = await import('@bitbard/core/audiodevice.js');
    vi.mocked(AudioDevice.defaultOutput).mockResolvedValueOnce(null);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(statusCmd, { rawArgs: [] });

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No default output device found'));
    consoleSpy.mockRestore();
  });
});
