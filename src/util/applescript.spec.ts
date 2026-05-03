import { describe, it, expect } from 'vitest';
import { runAppleScript } from './applescript.js';

describe('runAppleScript', () => {
  it('resolves with trimmed stdout', async () => {
    const result = await runAppleScript('return "hello world"');
    expect(result).toBe('hello world');
  });

  it('rejects on error', async () => {
    await expect(runAppleScript('bad script')).rejects.toThrow('Command failed: osascript -e bad script');
  });
});
