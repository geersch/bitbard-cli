import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from 'citty';
import convertCmd from './convert.js';
import { savePdf } from '../../util/pdf/save-pdf.js';
import { saveMarkdownPdf } from '../../util/pdf/save-markdown-pdf.js';
import { readFile } from 'node:fs/promises';

vi.mock('../../util/ui.js', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn() })),
  log: { error: vi.fn() },
}));

vi.mock('../../util/pdf/save-pdf.js', () => ({
  savePdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../../util/pdf/save-markdown-pdf.js', () => ({
  saveMarkdownPdf: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('node:fs/promises', () => ({
  readFile: vi.fn().mockResolvedValue('text from file'),
}));

describe('pdf convert command', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    errorSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('converts inline text to PDF', async () => {
    await runCommand(convertCmd, { rawArgs: ['--text', 'Hello world', 'output.pdf'] });
    expect(savePdf).toHaveBeenCalledWith('Hello world', 'output.pdf');
  });

  it('reads a .txt file and converts it to PDF', async () => {
    await runCommand(convertCmd, { rawArgs: ['--file', 'input.txt', 'output.pdf'] });
    expect(readFile).toHaveBeenCalledWith('input.txt', 'utf8');
    expect(savePdf).toHaveBeenCalledWith('text from file', 'output.pdf');
  });

  it('reads a .md file and converts it to a styled PDF', async () => {
    await runCommand(convertCmd, { rawArgs: ['--file', 'input.md', 'output.pdf'] });
    expect(readFile).toHaveBeenCalledWith('input.md', 'utf8');
    expect(saveMarkdownPdf).toHaveBeenCalledWith('text from file', 'output.pdf');
    expect(savePdf).not.toHaveBeenCalled();
  });

  it('exits with error when both --text and --file are provided', async () => {
    await expect(
      runCommand(convertCmd, { rawArgs: ['--text', 'Hello', '--file', 'input.txt', 'output.pdf'] }),
    ).rejects.toThrow('process.exit called');
    expect(errorSpy).toHaveBeenCalledWith('Error: provide either --text or --file, not both.');
  });

  it('exits with error when neither --text nor --file is provided', async () => {
    await expect(runCommand(convertCmd, { rawArgs: ['output.pdf'] })).rejects.toThrow('process.exit called');
    expect(errorSpy).toHaveBeenCalledWith('Error: provide --text <string> or --file <path>.');
  });

  it('exits with error when --file is not a .txt or .md file', async () => {
    await expect(runCommand(convertCmd, { rawArgs: ['--file', 'input.docx', 'output.pdf'] })).rejects.toThrow(
      'process.exit called',
    );
    expect(errorSpy).toHaveBeenCalledWith('Error: --file must be a .txt or .md file.');
  });

  it('exits with error when output is not a .pdf file', async () => {
    await expect(runCommand(convertCmd, { rawArgs: ['--text', 'Hello world', 'output.txt'] })).rejects.toThrow(
      'process.exit called',
    );
    expect(errorSpy).toHaveBeenCalledWith('Error: output file must have a .pdf extension.');
  });

  it('exits with error and prints message when savePdf throws', async () => {
    vi.mocked(savePdf).mockRejectedValueOnce(new Error('disk full'));
    await expect(runCommand(convertCmd, { rawArgs: ['--text', 'Hello world', 'output.pdf'] })).rejects.toThrow(
      'process.exit called',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('exits with error and prints message when saveMarkdownPdf throws', async () => {
    vi.mocked(saveMarkdownPdf).mockRejectedValueOnce(new Error('write error'));
    await expect(runCommand(convertCmd, { rawArgs: ['--file', 'input.md', 'output.pdf'] })).rejects.toThrow(
      'process.exit called',
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
