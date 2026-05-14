import { describe, it, expect, vi, beforeEach } from 'vitest';
import { execFile, spawn } from 'node:child_process';
import { get, set, del, SECURITY_BIN } from './keychain.js';

vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
  spawn: vi.fn(),
}));

const SERVICE = 'bitbard-test';

beforeEach(() => vi.resetAllMocks());

describe('get', () => {
  it('returns base64-decoded value on success', async () => {
    const encoded = Buffer.from('base64:' + Buffer.from('my-token').toString('base64')).toString();
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(null, encoded + '\n', '');
      return {} as any;
    });
    const result = await get(SERVICE, 'access_token');
    expect(result).toBe('my-token');
  });

  it('throws if not found', async () => {
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(new Error('exit 44'), '', 'The specified item could not be found.');
      return {} as any;
    });
    await expect(get(SERVICE, 'access_token')).rejects.toThrow('not found');
  });
});

describe('set', () => {
  it('writes via stdin with base64-encoded value and upsert flag', async () => {
    const stdinWrite = vi.fn();
    const stdinEnd = vi.fn();
    const mockChild = {
      stdin: { write: stdinWrite, end: stdinEnd },
      on: vi.fn((_event: string, cb: () => void) => {
        if (_event === 'close') cb();
        return mockChild;
      }),
    };
    vi.mocked(spawn).mockReturnValue(mockChild as any);

    await set(SERVICE, 'access_token', 'my-token');

    expect(spawn).toHaveBeenCalledWith(SECURITY_BIN, ['-i']);
    expect(stdinWrite).toHaveBeenCalledWith(expect.stringContaining('add-generic-password -U'));
    expect(stdinWrite).toHaveBeenCalledWith(expect.stringContaining('-s "bitbard-test"'));
    expect(stdinWrite).toHaveBeenCalledWith(expect.stringContaining('-a "access_token"'));
    // value must be base64-encoded, not plaintext
    const encoded = Buffer.from('base64:' + Buffer.from('my-token').toString('base64')).toString();
    expect(stdinWrite).toHaveBeenCalledWith(expect.stringContaining(encoded));
    expect(stdinEnd).toHaveBeenCalled();
  });
});

describe('del', () => {
  it('calls delete-generic-password', async () => {
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(null, '', '');
      return {} as any;
    });
    await del(SERVICE, 'access_token');
    expect(execFile).toHaveBeenCalledWith(
      SECURITY_BIN,
      ['delete-generic-password', '-s', SERVICE, '-a', 'access_token'],
      expect.any(Function),
    );
  });

  it('throws if not found', async () => {
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) => {
      cb(new Error('exit 44'), '', 'The specified item could not be found.');
      return {} as any;
    });
    await expect(del(SERVICE, 'access_token')).rejects.toThrow('not found');
  });
});
