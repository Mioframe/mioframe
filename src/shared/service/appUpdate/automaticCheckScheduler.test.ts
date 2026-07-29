import { describe, expect, it, vi } from 'vitest';
import { createAutomaticCheckScheduler } from './automaticCheckScheduler';

describe('createAutomaticCheckScheduler', () => {
  it('runs the scheduled action on the first call', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutomaticCheckScheduler();

    await scheduler.scheduleOnce(run);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('ignores every later call within the same lifetime, returning the same in-flight attempt', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const scheduler = createAutomaticCheckScheduler();

    const first = scheduler.scheduleOnce(run);
    const second = scheduler.scheduleOnce(run);
    const third = scheduler.scheduleOnce(run);
    await Promise.all([first, second, third]);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it('never throws or rejects when the scheduled action fails, so it is always safe for event.waitUntil', async () => {
    const run = vi.fn().mockRejectedValue(new Error('check failed'));
    const scheduler = createAutomaticCheckScheduler();

    await expect(scheduler.scheduleOnce(run)).resolves.toBeUndefined();
  });
});
