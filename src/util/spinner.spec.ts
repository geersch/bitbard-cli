import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spinner } from './spinner.js';

describe('spinner — non-TTY', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true });
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes nothing on start', () => {
    spinner('Loading');
    expect(writeSpy).not.toHaveBeenCalled();
  });

  it('stop function writes nothing', () => {
    const stop = spinner('Loading');
    stop('Done');
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe('spinner — TTY', () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(process.stdout, 'isTTY', { value: true, configurable: true });
    writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('writes an initial spinner frame with the label on start', () => {
    spinner('Loading');
    const firstCall = writeSpy.mock.calls[0][0] as string;
    expect(firstCall).toContain('Loading');
  });

  it('writes additional frames on each interval tick', () => {
    spinner('Loading');
    const callsBefore = writeSpy.mock.calls.length;
    vi.advanceTimersByTime(160); // two 80 ms ticks
    expect(writeSpy.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('stop function clears the interval and writes the done message', () => {
    const stop = spinner('Loading');
    writeSpy.mockClear();
    stop('All done');
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('All done');
  });

  it('stop function shows a green check on success', () => {
    const stop = spinner('Loading');
    writeSpy.mockClear();
    stop('All done', true);
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('✓');
  });

  it('stop function shows a yellow cross on failure', () => {
    const stop = spinner('Loading');
    writeSpy.mockClear();
    stop('Something failed', false);
    const output = writeSpy.mock.calls[0][0] as string;
    expect(output).toContain('✗');
  });

  it('stop function does not write more frames after stopping', () => {
    const stop = spinner('Loading');
    stop('Done');
    writeSpy.mockClear();
    vi.advanceTimersByTime(500);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
