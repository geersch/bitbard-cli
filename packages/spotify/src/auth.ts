import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import open from 'open';
import { get, set, del } from '@bitbard/core/security/keychain.js';
import { SpotifyNotLoggedInError, SpotifySessionExpiredError } from './errors.js';

const SERVICE = 'bitbard-spotify';
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = 'user-read-playback-state user-modify-playback-state';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const AUTH_URL = 'https://accounts.spotify.com/authorize';
// Refresh if token expires within 60 seconds
const EXPIRY_BUFFER_MS = 60 * 1000;

function generateCodeVerifier(): string {
  return randomBytes(96).toString('base64url').slice(0, 128);
}

function generateCodeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

function waitForCode(): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://127.0.0.1:8888`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      res.end('<html><body>You can close this tab.</body></html>');
      res.socket?.destroy();
      server.close();
      if (error) reject(new Error(`Spotify auth error: ${error}`));
      else if (code) resolve(code);
      else reject(new Error('No code received from Spotify'));
    });
    server.listen(8888, '127.0.0.1', () => {});
    server.on('error', (err) => reject(err));
  });
}

async function exchangeCode(
  code: string,
  codeVerifier: string,
  clientId: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: clientId,
    code_verifier: codeVerifier,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

async function refreshTokens(
  refreshToken: string,
  clientId: string,
): Promise<{ accessToken: string; refreshToken: string; expiresAt: number }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed ${res.status}: ${text}`);
  }
  const data = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export async function login(clientId: string): Promise<void> {
  const verifier = generateCodeVerifier();
  const challenge = generateCodeChallenge(verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });

  const codePromise = waitForCode();
  await open(`${AUTH_URL}?${params}`);
  const code = await codePromise;

  const { accessToken, refreshToken, expiresAt } = await exchangeCode(code, verifier, clientId);

  await Promise.allSettled([
    set(SERVICE, 'client_id', clientId),
    set(SERVICE, 'access_token', accessToken),
    set(SERVICE, 'refresh_token', refreshToken),
    set(SERVICE, 'expires_at', String(expiresAt)),
  ]);
}

export async function logout(): Promise<void> {
  await Promise.allSettled([
    del(SERVICE, 'client_id'),
    del(SERVICE, 'access_token'),
    del(SERVICE, 'refresh_token'),
    del(SERVICE, 'expires_at'),
  ]);
}

export async function getAccessToken(): Promise<string> {
  let accessToken: string;
  let expiresAt: number;

  try {
    [accessToken, expiresAt] = await Promise.all([
      get(SERVICE, 'access_token'),
      get(SERVICE, 'expires_at').then(Number),
    ]);
  } catch {
    throw new SpotifyNotLoggedInError();
  }

  if (Date.now() + EXPIRY_BUFFER_MS >= expiresAt) {
    let refreshToken: string;
    let clientId: string;

    try {
      [refreshToken, clientId] = await Promise.all([get(SERVICE, 'refresh_token'), get(SERVICE, 'client_id')]);
    } catch {
      throw new SpotifySessionExpiredError();
    }

    const tokens = await refreshTokens(refreshToken, clientId);
    await set(SERVICE, 'access_token', tokens.accessToken);
    await set(SERVICE, 'refresh_token', tokens.refreshToken);
    await set(SERVICE, 'expires_at', String(tokens.expiresAt));
    return tokens.accessToken;
  }

  return accessToken;
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    await get(SERVICE, 'access_token');
    return true;
  } catch {
    return false;
  }
}
