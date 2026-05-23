import { RequestInitWithTls, PrivateSession } from '../auth.js';

export interface RingSettings {
  cameraId: string;
  repeatTimes: number;
  ringtoneId: string;
  volume: number;
}

export interface Chime {
  id: string;
  modelKey: string;
  state: string;
  name: string;
  mac: string;
  cameraIds: string[];
  ringSettings: RingSettings[];
}

export async function getChimes(host: string, apiKey: string): Promise<Chime[]> {
  const requestInit: RequestInitWithTls = {
    method: 'GET',
    headers: {
      'X-API-KEY': apiKey,
      Accept: 'application/json',
    },
    tls: { rejectUnauthorized: false },
  };
  const res = await fetch(`${host}/proxy/protect/integration/v1/chimes`, requestInit);
  if (!res.ok) throw new Error(`Failed to fetch chimes: ${res.status} ${await res.text()}`);
  return res.json() as Promise<Chime[]>;
}

export async function playSpeaker(
  host: string,
  authentication: PrivateSession,
  chimeId: string,
  options?: {
    volume?: number;
    ringtoneId?: string;
    repeatTimes?: number;
  },
): Promise<void> {
  const requestInit: RequestInitWithTls = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: `TOKEN=${authentication.token}`,
      'x-csrf-token': authentication.csrf,
    },
    body: JSON.stringify({
      volume: options?.volume ?? 5,
      repeatTimes: options?.repeatTimes ?? 1,
      ringtoneId: options?.ringtoneId,
    }),
    tls: { rejectUnauthorized: false },
  };
  const res = await fetch(`${host}/proxy/protect/api/chimes/${chimeId}/play-speaker`, requestInit);
  if (!res.ok) throw new Error(`Play failed: ${res.status} ${await res.text()}`);
}
