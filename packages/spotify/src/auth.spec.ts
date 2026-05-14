import * as keychain from '@bitbard/core/security/keychain.js';
import { createServer } from 'node:http';
import open from 'open';
import { login, logout, getAccessToken, isLoggedIn } from './auth.js';
import { SpotifyNotLoggedInError } from './errors.js';

const mockFetch = vi.fn();
global.fetch = mockFetch;

vi.mock('node:http', () => ({
  createServer: vi.fn(),
}));

// Mock open (browser launcher) — it's a default export
vi.mock('open', () => ({ default: vi.fn() }));

vi.mock('@bitbard/core/security/keychain.js', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}));

const SERVICE = 'bitbard-spotify';

beforeEach(() => vi.resetAllMocks());

describe('isLoggedIn', () => {
  it('returns true when access_token exists in Keychain', async () => {
    vi.mocked(keychain.get).mockResolvedValue('tok');
    expect(await isLoggedIn()).toBe(true);
    expect(keychain.get).toHaveBeenCalledWith(SERVICE, 'access_token');
  });

  it('returns false when access_token is not in Keychain', async () => {
    vi.mocked(keychain.get).mockRejectedValue(new Error('not found'));
    expect(await isLoggedIn()).toBe(false);
  });
});

describe('logout', () => {
  it('deletes all four keychain entries', async () => {
    vi.mocked(keychain.del).mockResolvedValue(undefined);
    await logout();
    expect(keychain.del).toHaveBeenCalledWith(SERVICE, 'client_id');
    expect(keychain.del).toHaveBeenCalledWith(SERVICE, 'access_token');
    expect(keychain.del).toHaveBeenCalledWith(SERVICE, 'refresh_token');
    expect(keychain.del).toHaveBeenCalledWith(SERVICE, 'expires_at');
  });

  it('does not throw if entries are already missing', async () => {
    vi.mocked(keychain.del).mockRejectedValue(new Error('not found'));
    await expect(logout()).resolves.not.toThrow();
  });
});

describe('getAccessToken', () => {
  it('returns token when not expired', async () => {
    const expiresAt = String(Date.now() + 3600 * 1000);

    vi.mocked(keychain.get).mockImplementation((_service, key) => {
      if (key === 'access_token') return Promise.resolve('my-access-token');
      if (key === 'expires_at') return Promise.resolve(expiresAt);
      return Promise.reject(new Error('unexpected'));
    });

    const token = await getAccessToken();
    expect(token).toBe('my-access-token');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('refreshes and returns new token when expired', async () => {
    const expired = String(Date.now() - 1000);

    vi.mocked(keychain.get).mockImplementation((_service, key) => {
      if (key === 'access_token') return Promise.resolve('old-access-token');
      if (key === 'expires_at') return Promise.resolve(expired);
      if (key === 'refresh_token') return Promise.resolve('my-refresh-token');
      if (key === 'client_id') return Promise.resolve('my-client-id');
      return Promise.reject(new Error('unexpected'));
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
      }),
    });

    const token = await getAccessToken();
    expect(token).toBe('new-access-token');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'access_token', 'new-access-token');
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'refresh_token', 'new-refresh-token');
  });

  it('throws SpotifyNotLoggedInError when not logged in', async () => {
    vi.mocked(keychain.get).mockRejectedValue(new Error('not found'));
    await expect(getAccessToken()).rejects.toThrow(SpotifyNotLoggedInError);
  });
});

describe('login', () => {
  it('stores client_id, opens browser, exchanges code, stores tokens', async () => {
    // Simulate HTTP server that immediately calls the callback handler with ?code=authcode
    let capturedHandler: ((req: any, res: any) => void) | null = null;
    const mockServer = {
      listen: vi.fn((_port: number, _host: string, cb: () => void) => cb()),
      close: vi.fn(),
      on: vi.fn(),
    };
    vi.mocked(createServer).mockImplementation((handler: any) => {
      capturedHandler = handler;
      return mockServer as any;
    });

    // Simulate browser redirecting to callback after open() is called
    vi.mocked(open).mockImplementation(async () => {
      const req = { url: '/callback?code=authcode' };
      const res = { end: vi.fn() };
      capturedHandler!(req, res);
      return {} as any;
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'acc',
        refresh_token: 'ref',
        expires_in: 3600,
      }),
    });
    vi.mocked(keychain.set).mockResolvedValue(undefined);

    await login('my-client-id');

    expect(open).toHaveBeenCalledWith(expect.stringContaining('my-client-id'));
    expect(open).toHaveBeenCalledWith(expect.stringContaining('code_challenge'));
    expect(mockFetch).toHaveBeenCalledWith(
      'https://accounts.spotify.com/api/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'client_id', 'my-client-id');
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'access_token', 'acc');
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'refresh_token', 'ref');
    expect(keychain.set).toHaveBeenCalledWith(SERVICE, 'expires_at', expect.any(String));
  });
});
