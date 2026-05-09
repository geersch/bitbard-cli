import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(() => ({ unref: vi.fn() })),
  execSync: vi.fn(),
}));

vi.mock('node:os', () => ({
  homedir: vi.fn(() => '/home/user'),
}));

describe('caffeinate', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...process.env };
    delete process.env.BITBARD_BIN_DIR;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('lockScreen', () => {
    it('spawns the lock binary detached with no args', async () => {
      const { spawn } = await import('node:child_process');
      const { lockScreen } = await import('./caffeinate.js');

      lockScreen();

      expect(spawn).toHaveBeenCalledWith('/home/user/.local/share/bitbard/bin/lock', [], {
        detached: true,
        stdio: 'ignore',
      });
    });

    it('calls unref() on the child process', async () => {
      const { spawn } = await import('node:child_process');
      const mockChild = { unref: vi.fn() };
      vi.mocked(spawn).mockReturnValueOnce(mockChild as never);

      const { lockScreen } = await import('./caffeinate.js');
      lockScreen();

      expect(mockChild.unref).toHaveBeenCalledOnce();
    });
  });

  describe('startScreensaver', () => {
    it('executes open -a ScreenSaverEngine', async () => {
      const { execSync } = await import('node:child_process');
      const { startScreensaver } = await import('./caffeinate.js');

      startScreensaver();

      expect(execSync).toHaveBeenCalledWith('open -a ScreenSaverEngine');
    });
  });
});
