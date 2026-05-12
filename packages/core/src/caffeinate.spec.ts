import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('./daemon.js', () => ({
  sendCommand: vi.fn().mockResolvedValue({ ok: true, result: 'ok' }),
}));

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('caffeinate', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('lockScreen', () => {
    it('calls sendCommand with lock command', async () => {
      const { sendCommand } = await import('./daemon.js');
      const { lockScreen } = await import('./caffeinate.js');

      lockScreen();

      expect(sendCommand).toHaveBeenCalledWith({ lock: {} });
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
