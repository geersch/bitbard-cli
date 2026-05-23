import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runCommand } from 'citty';

vi.mock('@bitbard/spotify/app.js', () => ({
  launch: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@bitbard/spotify/playback.js', () => ({
  playpause: vi.fn().mockResolvedValue(undefined),
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn().mockResolvedValue(undefined),
  previousTrack: vi.fn().mockResolvedValue(undefined),
  nextTrack: vi.fn().mockResolvedValue(undefined),
  getNowPlaying: vi.fn().mockResolvedValue({ artist: 'Radiohead', track: 'Karma Police' }),
  volumeUp: vi.fn().mockResolvedValue(undefined),
  volumeDown: vi.fn().mockResolvedValue(undefined),
}));

// Add a new vi.mock block (alongside the existing @bitbard/core/spotify.js mock).
// Do NOT replace or duplicate the existing beforeEach(() => vi.clearAllMocks()) — leave it as-is.
vi.mock('@bitbard/spotify/auth.js', () => ({
  login: vi.fn().mockResolvedValue(undefined),
  logout: vi.fn().mockResolvedValue(undefined),
  isLoggedIn: vi.fn().mockResolvedValue(false),
}));

vi.mock('@bitbard/spotify/devices.js', () => ({
  getDevices: vi.fn(),
  transferPlayback: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@clack/prompts', () => ({
  select: vi.fn(),
  isCancel: vi.fn(),
  log: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  spinner: vi.fn().mockImplementation(() => ({ start: vi.fn(), stop: vi.fn() })),
}));

import * as spotifyApp from '@bitbard/spotify/app.js';
import * as spotifyUtil from '@bitbard/spotify/playback.js';
import * as spotifyAuth from '@bitbard/spotify/auth.js';
import * as spotifyDevices from '@bitbard/spotify/devices.js';
import * as clack from '@clack/prompts';

import launchCmd from './launch.js';
import playCmd from './play.js';
import previousCmd from './previous.js';
import nextCmd from './next.js';
import nowCmd from './now.js';
import volumeUpCmd from './volume-up.js';
import volumeDownCmd from './volume-down.js';
import loginCmd from './login.js';
import logoutCmd from './logout.js';
import speakersCmd from './speakers.js';
import speakerCmd from './speaker.js';

const mockDevices = [
  { id: 'abc', name: 'MacBook Pro', type: 'Computer', isActive: true, volumePercent: 80 },
  { id: 'def', name: 'Living Room', type: 'Speaker', isActive: false, volumePercent: 50 },
];

beforeEach(() => vi.clearAllMocks());

describe('spotify launch', () => {
  it('calls launch()', async () => {
    await runCommand(launchCmd, { rawArgs: [] });
    expect(spotifyApp.launch).toHaveBeenCalledOnce();
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

describe('spotify login', () => {
  it('calls login() with provided client-id and default port', async () => {
    await runCommand(loginCmd, { rawArgs: ['--client-id', 'my-id'] });
    expect(spotifyAuth.login).toHaveBeenCalledWith('my-id', 8888);
  });

  it('calls login() with provided client-id and custom port', async () => {
    await runCommand(loginCmd, { rawArgs: ['--client-id', 'my-id', '--port', '9999'] });
    expect(spotifyAuth.login).toHaveBeenCalledWith('my-id', 9999);
  });

  it('prints message and skips login if already logged in', async () => {
    vi.mocked(spotifyAuth.isLoggedIn).mockResolvedValueOnce(true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(loginCmd, { rawArgs: ['--client-id', 'my-id'] });
    expect(spotifyAuth.login).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Already'));
    logSpy.mockRestore();
  });
});

describe('spotify logout', () => {
  it('calls logout()', async () => {
    await runCommand(logoutCmd, { rawArgs: [] });
    expect(spotifyAuth.logout).toHaveBeenCalledOnce();
  });
});

describe('spotify speakers', () => {
  beforeEach(() => {
    vi.mocked(spotifyAuth.isLoggedIn).mockResolvedValue(true);
  });

  it('prints device list with active marker', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue(mockDevices);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(speakersCmd, { rawArgs: [] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('MacBook Pro'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Living Room'));
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('active'));
    logSpy.mockRestore();
  });

  it('prints message when no devices found', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(speakersCmd, { rawArgs: [] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No devices found'));
    logSpy.mockRestore();
  });
});

describe('spotify speaker (no argument)', () => {
  beforeEach(() => {
    vi.mocked(spotifyAuth.isLoggedIn).mockResolvedValue(true);
  });

  it('shows select prompt and transfers playback on selection', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue(mockDevices);
    vi.mocked(clack.isCancel).mockReturnValue(false);
    vi.mocked(clack.select).mockResolvedValue('def');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await runCommand(speakerCmd, { rawArgs: [] });

    expect(clack.select).toHaveBeenCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([
          expect.objectContaining({ value: 'abc' }),
          expect.objectContaining({ value: 'def' }),
        ]),
      }),
    );
    expect(spotifyDevices.transferPlayback).toHaveBeenCalledWith('def');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Living Room'));
    logSpy.mockRestore();
  });

  it('exits silently on cancel', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue(mockDevices);
    vi.mocked(clack.select).mockResolvedValue(Symbol('cancel'));
    vi.mocked(clack.isCancel).mockReturnValue(true);

    await runCommand(speakerCmd, { rawArgs: [] });

    expect(spotifyDevices.transferPlayback).not.toHaveBeenCalled();
  });

  it('prints message when no devices available', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue([]);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(speakerCmd, { rawArgs: [] });
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('No devices found'));
    expect(clack.select).not.toHaveBeenCalled();
    logSpy.mockRestore();
  });
});

describe('spotify speaker <id>', () => {
  beforeEach(() => {
    vi.mocked(spotifyAuth.isLoggedIn).mockResolvedValue(true);
  });

  it('transfers to matching device without showing prompt', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue(mockDevices);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await runCommand(speakerCmd, { rawArgs: ['abc'] });
    expect(clack.select).not.toHaveBeenCalled();
    expect(spotifyDevices.transferPlayback).toHaveBeenCalledWith('abc');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('MacBook Pro'));
    logSpy.mockRestore();
  });

  it('prints error when ID does not match any device', async () => {
    vi.mocked(spotifyDevices.getDevices).mockResolvedValue(mockDevices);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await runCommand(speakerCmd, { rawArgs: ['unknown-id'] });
    expect(spotifyDevices.transferPlayback).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('unknown-id'));
    errorSpy.mockRestore();
  });
});
