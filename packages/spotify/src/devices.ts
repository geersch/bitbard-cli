import { getAccessToken } from './auth.js';

const API = 'https://api.spotify.com/v1';

export interface SpotifyDevice {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  volumePercent: number | null;
}

export async function getDevices(): Promise<SpotifyDevice[]> {
  const token = await getAccessToken();
  const res = await fetch(`${API}/me/player/devices`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as {
    devices: Array<{
      id: string;
      name: string;
      type: string;
      is_active: boolean;
      volume_percent: number | null;
    }>;
  };
  return data.devices.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    isActive: d.is_active,
    volumePercent: d.volume_percent,
  }));
}

export async function transferPlayback(deviceId: string): Promise<void> {
  const token = await getAccessToken();
  const res = await fetch(`${API}/me/player`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ device_ids: [deviceId] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify API error ${res.status}: ${text}`);
  }
}
