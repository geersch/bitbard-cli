import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type VpnStatus = 'Connected' | 'Disconnected' | 'Connecting' | 'Disconnecting' | 'Unknown';

export interface VpnConfig {
  name: string;
  id: string;
  status: VpnStatus;
}

const KNOWN_STATUSES = new Set<VpnStatus>(['Connected', 'Disconnected', 'Connecting', 'Disconnecting']);

function toVpnStatus(raw: string): VpnStatus {
  return KNOWN_STATUSES.has(raw as VpnStatus) ? (raw as VpnStatus) : 'Unknown';
}

// Parses an enabled line from `scutil --nc list`, e.g.:
// * (Disconnected)   XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX VPN (com.vpnclient.macos) "MyVPN"     [VPN:com.vpnclient.macos]
// Lines not starting with '*' are disabled and ignored.
function parseLine(line: string): VpnConfig | null {
  if (!line.startsWith('*')) return null;

  // Match: * (Status)  UUID  ...anything...  "Name"
  const match = line.match(/^\*\s*\((\w+)\)\s+([\w-]+)\s+.*?"([^"]+)"/);
  if (!match) return null;

  const id = match[2];
  const name = match[3];
  const status = toVpnStatus(match[1]);

  return { name, id, status };
}

export async function listVpnConfigs(): Promise<VpnConfig[]> {
  const { stdout } = await execFileAsync('scutil', ['--nc', 'list']);
  return stdout
    .split('\n')
    .map(parseLine)
    .filter((c): c is VpnConfig => c !== null);
}

export async function getVpnStatus(id: string): Promise<VpnStatus> {
  const { stdout } = await execFileAsync('scutil', ['--nc', 'status', id]);
  const match = stdout.match(/^\s*(\w+)/);
  return match ? toVpnStatus(match[1]) : 'Unknown';
}

export async function startVpn(id: string): Promise<void> {
  await execFileAsync('scutil', ['--nc', 'start', id]);
}

export async function stopVpn(id: string): Promise<void> {
  await execFileAsync('scutil', ['--nc', 'stop', id]);
}
