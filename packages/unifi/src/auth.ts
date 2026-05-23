import { get, set, del } from '@bitbard/core/security/keychain.js';

const SERVICE = 'bitbard-unifi';
const ACCOUNT = 'credentials';
const SESSION_ACCOUNT = 'session';
const SESSION_EXPIRY_BUFFER_MS = 60 * 1000;

export interface UnifiCredentials {
  shared: { host: string };
  public: { apiKey: string };
  private: { username: string; password: string };
}

export interface TlsOptions {
  rejectUnauthorized?: boolean;
}

export interface FetchOptions {
  tls?: TlsOptions;
}

export type RequestInitWithTls = RequestInit & FetchOptions;

export interface PrivateSession {
  token: string;
  csrf: string;
  expiresAt: number;
}

function decodeTokenExpiry(token: string): number {
  const payload = token.split('.')[1];
  if (!payload) throw new Error('Invalid token: missing payload');
  const json = Buffer.from(payload, 'base64url').toString('utf8');
  const { exp } = JSON.parse(json) as { exp?: number };
  if (typeof exp !== 'number') throw new Error('Invalid token: missing exp claim');
  return exp * 1000;
}

export async function saveCredentials(creds: UnifiCredentials): Promise<void> {
  await set(SERVICE, ACCOUNT, JSON.stringify(creds));
}

export async function getCredentials(): Promise<UnifiCredentials> {
  const raw = await get(SERVICE, ACCOUNT);
  return JSON.parse(raw) as UnifiCredentials;
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    await getCredentials();
    return true;
  } catch {
    return false;
  }
}

export async function deleteCredentials(): Promise<void> {
  await Promise.allSettled([del(SERVICE, ACCOUNT), del(SERVICE, SESSION_ACCOUNT)]);
}

async function saveSession(session: PrivateSession): Promise<void> {
  await set(SERVICE, SESSION_ACCOUNT, JSON.stringify(session));
}

async function loadSession(): Promise<PrivateSession | null> {
  try {
    const raw = await get(SERVICE, SESSION_ACCOUNT);
    return JSON.parse(raw) as PrivateSession;
  } catch {
    return null;
  }
}

export async function getPrivateSession(host: string, username: string, password: string): Promise<PrivateSession> {
  const cached = await loadSession();
  if (cached && Date.now() + SESSION_EXPIRY_BUFFER_MS < cached.expiresAt) {
    return { token: cached.token, csrf: cached.csrf, expiresAt: cached.expiresAt };
  }

  const requestInit: RequestInitWithTls = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password,
      rememberMe: false,
    }),
    tls: {
      rejectUnauthorized: false,
    },
  };
  const res = await fetch(`${host}/api/auth/login`, requestInit);

  if (!res.ok) throw new Error(`Login failed: ${res.status}`);

  const csrf = res.headers.get('x-csrf-token');
  const cookie = res.headers.get('set-cookie');
  const token = cookie?.match(/TOKEN=([^;]+)/)?.[1];

  if (!token) throw new Error('No TOKEN cookie in login response');
  if (!csrf) throw new Error('No x-csrf-token in login response');

  const session: PrivateSession = { token, csrf, expiresAt: decodeTokenExpiry(token) };
  await saveSession(session);
  return session;
}
