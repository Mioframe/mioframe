import { describe, expect, it } from 'vitest';
import { createOperationQueue } from './operationQueue';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('createOperationQueue', () => {
  it('runs a single operation and returns its result', async () => {
    const enqueue = createOperationQueue();
    const result = await enqueue(() => Promise.resolve('done'));
    expect(result).toBe('done');
  });

  it('runs operations strictly in enqueue order, not completion order', async () => {
    const enqueue = createOperationQueue();
    const order: string[] = [];
    const first = deferred<undefined>();

    const firstCall = enqueue(() => first.promise.then(() => order.push('first')));
    const secondCall = enqueue(() => Promise.resolve(order.push('second')));

    // The second operation must not run before the first settles, even
    // though the first is deliberately held open here.
    await Promise.resolve();
    await Promise.resolve();
    expect(order).toEqual([]);

    first.resolve(undefined);
    await firstCall;
    await secondCall;

    expect(order).toEqual(['first', 'second']);
  });

  it('propagates each operation result independently to its own caller', async () => {
    const enqueue = createOperationQueue();
    const a = enqueue(() => Promise.resolve('a'));
    const b = enqueue(() => Promise.resolve('b'));
    const c = enqueue(() => Promise.resolve('c'));

    expect(await Promise.all([a, b, c])).toEqual(['a', 'b', 'c']);
  });

  it('a rejected operation does not block later operations from running', async () => {
    const enqueue = createOperationQueue();
    const order: string[] = [];

    const failing = enqueue(() => {
      order.push('failing');
      return Promise.reject(new Error('boom'));
    });
    const next = enqueue(() => {
      order.push('next');
      return Promise.resolve('ok');
    });

    await expect(failing).rejects.toThrow('boom');
    await expect(next).resolves.toBe('ok');
    expect(order).toEqual(['failing', 'next']);
  });
});
