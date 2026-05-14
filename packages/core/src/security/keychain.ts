import { execFile, spawn } from 'node:child_process';

export const SECURITY_BIN = '/usr/bin/security';
const BASE64_PREFIX = 'base64:';

function isNotFound(err: unknown, stderr: string): boolean {
  const message = stderr + String((err as Error).message ?? '');
  return message.includes('could not be found');
}

export async function get(service: string, account: string): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(SECURITY_BIN, ['find-generic-password', '-s', service, '-wa', account], (err, stdout, stderr) => {
      if (err) {
        if (isNotFound(err, stderr)) {
          reject(new Error(`Keychain item not found: ${service}/${account}`));
        } else {
          reject(err);
        }
        return;
      }

      const trimmed = stdout.trim();
      if (trimmed.startsWith(BASE64_PREFIX)) {
        resolve(Buffer.from(trimmed.slice(BASE64_PREFIX.length), 'base64').toString('utf8'));
      } else {
        resolve(trimmed);
      }
    });
  });
}

export async function set(service: string, account: string, value: string): Promise<void> {
  const encoded = BASE64_PREFIX + Buffer.from(value).toString('base64');
  await new Promise<void>((resolve, reject) => {
    const child = spawn(SECURITY_BIN, ['-i']);
    child.on('close', (code) => {
      if (code === 0 || code == null) resolve();
      else reject(new Error(`security exited with code ${code}`));
    });
    // Write via stdin — prevents value appearing in process list
    child.stdin.write(`add-generic-password -U -s "${service}" -a "${account}" -w "${encoded}"\n`);
    child.stdin.end();
  });
}

export async function del(service: string, account: string): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(SECURITY_BIN, ['delete-generic-password', '-s', service, '-a', account], (err, _stdout, stderr) => {
      if (err) {
        if (isNotFound(err, stderr)) {
          reject(new Error(`Keychain item not found: ${service}/${account}`));
        } else {
          reject(err);
        }
        return;
      }
      resolve();
    });
  });
}
