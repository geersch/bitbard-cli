import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCommand } from 'citty';

vi.mock('../../util/spotify.js', () => ({
  launch: vi.fn().mockResolvedValue(undefined),
  playpause: vi.fn().mockResolvedValue(undefined),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  previousTrack: vi.fn().mockResolvedValue(undefined),
  nextTrack: vi.fn().mockResolvedValue(undefined),
  getNowPlaying: vi.fn().mockResolvedValue({ artist: 'Radiohead', track: 'Karma Police' }),
  volumeUp: vi.fn().mockResolvedValue(undefined),
  volumeDown: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../util/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(true),
}));

import * as spotifyUtil from '../../util/spotify.js';
import { isMacOS } from '../../util/platform.js';

import launchCmd from './launch.js';
import playCmd from './play.js';
import previousCmd from './previous.js';
import nextCmd from './next.js';
import nowCmd from './now.js';
import volumeUpCmd from './volume-up.js';
import volumeDownCmd from './volume-down.js';

beforeEach(() => vi.clearAllMocks());

describe('spotify launch', () => {
  it('calls launch()', async () => {
    await runCommand(launchCmd, { rawArgs: [] });
    expect(spotifyUtil.launch).toHaveBeenCalledOnce();
  });

  it('does not call launch() on non-macOS', async () => {
    vi.mocked(isMacOS).mockReturnValueOnce(false);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runCommand(launchCmd, { rawArgs: [] });
    expect(spotifyUtil.launch).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe('spotify play', () => {
  it('calls play()', async () => {
    await runCommand(playCmd, { rawArgs: [] });
    expect(spotifyUtil.play).toHaveBeenCalledOnce();
  });
});

describe('spotify previous', () => {
  it('calls previousTrack()', async () => {
    await runCommand(previousCmd, { rawArgs: [] });
    expect(spotifyUtil.previousTrack).toHaveBeenCalledOnce();
  });
});

describe('spotify next', () => {
  it('calls nextTrack()', async () => {
    await runCommand(nextCmd, { rawArgs: [] });
    expect(spotifyUtil.nextTrack).toHaveBeenCalledOnce();
  });
});

describe('spotify now', () => {
  it('prints artist and track', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(nowCmd, { rawArgs: [] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Radiohead'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Karma Police'));
    logSpy.mockRestore();
  });

  it('prints "Nothing playing." when getNowPlaying returns null', async () => {
    vi.mocked(spotifyUtil.getNowPlaying).mockResolvedValueOnce(null);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(nowCmd, { rawArgs: [] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Nothing'));
    logSpy.mockRestore();
  });
});

describe('spotify volume-up', () => {
  it('calls volumeUp()', async () => {
    await runCommand(volumeUpCmd, { rawArgs: [] });
    expect(spotifyUtil.volumeUp).toHaveBeenCalledOnce();
  });
});

describe('spotify volume-down', () => {
  it('calls volumeDown()', async () => {
    await runCommand(volumeDownCmd, { rawArgs: [] });
    expect(spotifyUtil.volumeDown).toHaveBeenCalledOnce();
  });
});
