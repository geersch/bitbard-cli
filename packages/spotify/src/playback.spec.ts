vi.mock('@bitbard/core/applescript.js', () => ({
  runAppleScript: vi.fn(),
}));

import { runAppleScript } from '@bitbard/core/applescript.js';
import { playpause, previousTrack, nextTrack, getNowPlaying, volumeUp, volumeDown } from './playback.js';

beforeEach(() => vi.resetAllMocks());

describe('playpause', () => {
  it('sends playpause', async () => {
    vi.mocked(runAppleScript).mockResolvedValue('');
    await playpause();
    expect(runAppleScript).toHaveBeenCalledWith('tell application "Spotify" to playpause');
  });
});

describe('previousTrack', () => {
  it('sends previous track', async () => {
    vi.mocked(runAppleScript).mockResolvedValue('');
    await previousTrack();
    expect(runAppleScript).toHaveBeenCalledWith('tell application "Spotify" to previous track');
  });
});

describe('nextTrack', () => {
  it('sends next track', async () => {
    vi.mocked(runAppleScript).mockResolvedValue('');
    await nextTrack();
    expect(runAppleScript).toHaveBeenCalledWith('tell application "Spotify" to next track');
  });
});

describe('getNowPlaying', () => {
  it('returns artist, album and track', async () => {
    vi.mocked(runAppleScript)
      .mockResolvedValueOnce('Radiohead')
      .mockResolvedValueOnce('OK Computer')
      .mockResolvedValueOnce('Karma Police');
    const result = await getNowPlaying();
    expect(result).toEqual({ artist: 'Radiohead', album: 'OK Computer', track: 'Karma Police' });
  });
});

describe('volumeUp', () => {
  it('reads volume, adds 5, and sets it', async () => {
    vi.mocked(runAppleScript)
      .mockResolvedValueOnce('60') // getVolume: tell sound volume
      .mockResolvedValueOnce(''); // setVolume
    await volumeUp();
    expect(runAppleScript).toHaveBeenLastCalledWith('tell application "Spotify" to set sound volume to 65');
  });

  it('clamps volume at 100', async () => {
    vi.mocked(runAppleScript).mockResolvedValueOnce('98').mockResolvedValueOnce('');
    await volumeUp();
    expect(runAppleScript).toHaveBeenLastCalledWith('tell application "Spotify" to set sound volume to 100');
  });
});

describe('volumeDown', () => {
  it('reads volume, subtracts 5, and sets it', async () => {
    vi.mocked(runAppleScript).mockResolvedValueOnce('60').mockResolvedValueOnce('');
    await volumeDown();
    expect(runAppleScript).toHaveBeenLastCalledWith('tell application "Spotify" to set sound volume to 55');
  });

  it('clamps volume at 0', async () => {
    vi.mocked(runAppleScript).mockResolvedValueOnce('2').mockResolvedValueOnce('');
    await volumeDown();
    expect(runAppleScript).toHaveBeenLastCalledWith('tell application "Spotify" to set sound volume to 0');
  });
});
