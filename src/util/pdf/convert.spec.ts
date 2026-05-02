import { describe, it, expect } from 'vitest';
import { convert } from './convert.js';

describe('convert', () => {
  it('returns a Buffer', async () => {
    const result = await convert('hello world');
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('returns a non-empty Buffer', async () => {
    const result = await convert('hello world');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces a valid PDF (starts with %PDF header)', async () => {
    const result = await convert('hello world');
    expect(result.subarray(0, 4).toString()).toBe('%PDF');
  });
});
