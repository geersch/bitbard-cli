import os from 'node:os';

export function isMacOS(): boolean {
  return os.platform() === 'darwin';
}
