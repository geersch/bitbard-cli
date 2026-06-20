import os from 'node:os';

export function getLocalIp(): string | null {
  const interfaces = os.networkInterfaces();

  for (const iface of Object.values(interfaces)) {
    if (!iface) continue;
    for (const entry of iface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address;
      }
    }
  }

  return null;
}

export async function getPublicIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org', {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;

    const text = await res.text();
    return text.trim();
  } catch {
    return null;
  }
}
