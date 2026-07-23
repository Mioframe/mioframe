import { describe, expect, it } from 'vitest';
import { createCommandQueue } from './commandQueue';

describe('release controller command serialization', () => {
  it('does not overlap commands and continues after a rejected command', async () => {
    const enqueue = createCommandQueue();
    const events: string[] = [];
    let releaseFirst!: () => void;
    const firstBarrier = new Promise<void>((resolve) => (releaseFirst = resolve));
    const first = enqueue(async () => {
      events.push('first:start');
      await firstBarrier;
      events.push('first:end');
      throw new Error('expected');
    });
    const second = enqueue(() => {
      events.push('second');
      return Promise.resolve();
    });
    await Promise.resolve();
    expect(events).toEqual(['first:start']);
    releaseFirst();
    await expect(first).rejects.toThrow('expected');
    await second;
    expect(events).toEqual(['first:start', 'first:end', 'second']);
  });
});
