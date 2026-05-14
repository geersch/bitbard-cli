vi.mock('@bitbard/core/applescript.js', () => ({
  runAppleScript: vi.fn(),
}));

import { runAppleScript } from '@bitbard/core/applescript.js';
import { launch } from './app.js';

beforeEach(() => vi.resetAllMocks());

describe('launch', () => {
  it('activates Spotify', async () => {
    await launch();
    expect(runAppleScript).toHaveBeenCalledWith('tell application "Spotify" to activate');
  });
});
