import { describe, expect, it, vi } from 'vitest';
import { createAutomaticCheckScheduler } from './automaticCheckScheduler';

describe('createAutomaticCheckScheduler', () => {
  it('runs the scheduled action on the first call', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutomaticCheckScheduler();

    scheduler.scheduleOnce(run);
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('ignores every later call within the same lifetime', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutomaticCheckScheduler();

    scheduler.scheduleOnce(run);
    scheduler.scheduleOnce(run);
    scheduler.scheduleOnce(run);
    await Promise.resolve();

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('never throws or rejects when the scheduled action fails', async () => {
    const run = vi.fn().mockRejectedValue(new Error('check failed'));
    const scheduler = createAutomaticCheckScheduler();

    expect(() => {
      scheduler.scheduleOnce(run);
    }).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();
  });
});
