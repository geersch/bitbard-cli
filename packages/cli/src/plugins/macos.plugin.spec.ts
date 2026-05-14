import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from 'citty';

// All vi.mock calls must be at module level — vitest hoists them automatically.

vi.mock('@bitbard/core/platform.js', () => ({
  isMacOS: vi.fn().mockReturnValue(false),
}));

vi.mock('@bitbard/spotify/app.js', () => ({
  launch: vi.fn(),
}));

vi.mock('@bitbard/spotify/playback.js', () => ({
  play: vi.fn(),
  pause: vi.fn(),
  playpause: vi.fn(),
  previousTrack: vi.fn(),
  nextTrack: vi.fn(),
  getNowPlaying: vi.fn(),
  volumeUp: vi.fn(),
  volumeDown: vi.fn(),
}));

vi.mock('@bitbard/core/vpn.js', () => ({
  listVpnConfigs: vi.fn(),
  startVpn: vi.fn(),
  stopVpn: vi.fn(),
  getVpnStatus: vi.fn(),
}));

vi.mock('@bitbard/core/applescript.js', () => ({
  runAppleScript: vi.fn(),
}));

vi.mock('@bitbard/core/daemon.js', () => ({
  sendCommand: vi.fn().mockResolvedValue({ ok: true, result: 'ok' }),
}));

vi.mock('@bitbard/spotify/auth.js', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  isLoggedIn: vi.fn().mockResolvedValue(false),
  getAccessToken: vi.fn(),
}));

vi.mock('@bitbard/spotify/devices.js', () => ({
  getDevices: vi.fn().mockResolvedValue([]),
  transferPlayback: vi.fn(),
}));

// Mock all clack/prompts symbols used by leaf commands so nothing blocks.
vi.mock('@clack/prompts', () => ({
  select: vi.fn().mockResolvedValue('light'),
  isCancel: vi.fn().mockReturnValue(false),
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { isMacOS } from '@bitbard/core/platform.js';
import displayCmd from '../commands/display/index.js';
import spotifyCmd from '../commands/spotify/index.js';
import vpnCmd from '../commands/vpn/index.js';

describe('macOS plugin — non-macOS platform', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.mocked(isMacOS).mockReturnValue(false);
    // Prevent process.exit from actually exiting; capture the call
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('exits with code 1 and prints error for display commands on non-macOS', async () => {
    await runCommand(displayCmd, { rawArgs: ['darkmode'] });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('only supported on macOS'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 and prints error for spotify commands on non-macOS', async () => {
    await runCommand(spotifyCmd, { rawArgs: ['play'] });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('only supported on macOS'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with code 1 and prints error for vpn commands on non-macOS', async () => {
    await runCommand(vpnCmd, { rawArgs: ['list'] });
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('only supported on macOS'));
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});

describe('macOS plugin — macOS platform', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.mocked(isMacOS).mockReturnValue(true);
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('does not exit with code 1 for display commands on macOS', async () => {
    await runCommand(displayCmd, { rawArgs: ['darkmode'] }).catch(() => {});
    expect(exitSpy).not.toHaveBeenCalledWith(1);
  });

  it('does not exit with code 1 for spotify commands on macOS', async () => {
    await runCommand(spotifyCmd, { rawArgs: ['play'] }).catch(() => {});
    expect(exitSpy).not.toHaveBeenCalledWith(1);
  });

  it('does not exit with code 1 for vpn commands on macOS', async () => {
    await runCommand(vpnCmd, { rawArgs: ['list'] }).catch(() => {});
    expect(exitSpy).not.toHaveBeenCalledWith(1);
  });
});
