import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, readFileSync, rmSync } from 'fs';
import { savePdf } from './save-pdf.js';

describe('savePdf', () => {
  const outputPath = '/tmp/test-output.pdf';

  afterEach(() => {
    if (existsSync(outputPath)) rmSync(outputPath);
  });

  it('writes a file at the given path', async () => {
    await savePdf('hello world', outputPath);
    expect(existsSync(outputPath)).toBe(true);
  });

  it('writes a valid PDF (starts with %PDF header)', async () => {
    await savePdf('hello world', outputPath);
    const content = readFileSync(outputPath);
    expect(content.subarray(0, 4).toString()).toBe('%PDF');
  });
});
