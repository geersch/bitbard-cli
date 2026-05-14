vi.mock('./auth.js', () => ({
  getAccessToken: vi.fn(),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { getAccessToken } from './auth.js';
import { getDevices, transferPlayback } from './devices.js';

beforeEach(() => vi.resetAllMocks());

describe('getDevices', () => {
  it('returns parsed device list', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        devices: [
          { id: 'abc', name: 'MacBook Pro', type: 'Computer', is_active: true, volume_percent: 80 },
          { id: 'def', name: 'Living Room', type: 'Speaker', is_active: false, volume_percent: null },
        ],
      }),
    });

    const devices = await getDevices();
    expect(devices).toEqual([
      { id: 'abc', name: 'MacBook Pro', type: 'Computer', isActive: true, volumePercent: 80 },
      { id: 'def', name: 'Living Room', type: 'Speaker', isActive: false, volumePercent: null },
    ]);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player/devices',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    );
  });

  it('returns empty array when no devices', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ devices: [] }) });
    expect(await getDevices()).toEqual([]);
  });

  it('throws on non-2xx response', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ ok: false, status: 401, text: async () => 'Unauthorized' });
    await expect(getDevices()).rejects.toThrow('401');
  });
});

describe('transferPlayback', () => {
  it('calls PUT /v1/me/player with device_id', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ ok: true });

    await transferPlayback('abc');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.spotify.com/v1/me/player',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ device_ids: ['abc'] }),
      }),
    );
  });

  it('throws on non-2xx response', async () => {
    vi.mocked(getAccessToken).mockResolvedValue('tok');
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' });
    await expect(transferPlayback('abc')).rejects.toThrow('403');
  });
});
