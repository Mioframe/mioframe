/* eslint-disable @typescript-eslint/consistent-type-assertions -- structured-clone harness narrows an unknown wire payload. */
import { describe, it, expect, vi } from 'vitest';
import { createClient, createService } from './proxyService';
import { defineTransformer } from './defineTransformer';
import type { Provider } from './types';
import { uid } from 'uid/secure';
import { defineObservableQuery, useObservableQuery } from '@shared/lib/useObservableQuery';
import { effectScope, ref, watch } from 'vue';
import { Observable } from 'rxjs';
import { transformers } from '../wrapWorker/workerTransformerMap';

class MockProvider implements Provider {
  private listeners: Set<(p: { data: unknown }) => unknown> = new Set();
  public peer: MockProvider | null = null;
  public delay = 0;
  public transferLists: Transferable[][] = [];

  constructor(
    public myId: string,
    public peerId: string,
  ) {}

  postMessage(data: unknown, transfer: Transferable[] = []) {
    if (!this.peer) return;
    this.transferLists.push(transfer);
    // Structured cloning is the browser worker contract, including transferred buffers.
    const payload = structuredClone(data, { transfer }) as Record<string, unknown>;

    if (payload.serviceId === this.myId) {
      payload.serviceId = this.peerId;
    }

    setTimeout(() => {
      if (this.peer) {
        for (const listener of this.peer.listeners) {
          listener({ data: payload });
        }
      }
    }, this.delay);
  }

  addEventListener(_type: 'message', handler: (p: { data: unknown }) => unknown) {
    this.listeners.add(handler);
  }

  removeEventListener(_type: 'message', handler: (p: { data: unknown }) => unknown) {
    this.listeners.delete(handler);
  }
}

const createChannel = (clientId: string, serviceId: string) => {
  const p1 = new MockProvider(clientId, serviceId);
  const p2 = new MockProvider(serviceId, clientId);
  p1.peer = p2;
  p2.peer = p1;
  return { clientProvider: p1, serviceProvider: p2 };
};

describe('proxyService', () => {
  it('should call a remote function and return the result', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({
      greet: (name: string) => `Hello, ${name}`,
    }));

    const client = createClient<{ greet: (name: string) => string }>(clientProvider, clientId);

    const result = await client.greet('World');
    expect(result).toBe('Hello, World');
  });

  it('should support deep path property access', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({
      math: {
        add: (a: number, b: number) => a + b,
        complex: {
          multiply: (a: number, b: number) => a * b,
        },
      },
    }));

    type ServiceAPI = Record<string, unknown> & {
      math: {
        add: (a: number, b: number) => number;
        complex: {
          multiply: (a: number, b: number) => number;
        };
      };
    };

    const client = createClient<ServiceAPI>(clientProvider, clientId);

    expect(await client.math.add(5, 7)).toBe(12);
    expect(await client.math.complex.multiply(3, 4)).toBe(12);
  });

  it('should propagate errors thrown by the service', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({
      throwError: () => {
        throw new Error('Service Error');
      },
    }));

    const client = createClient<{ throwError: () => void }>(clientProvider, clientId);

    await expect(client.throwError()).rejects.toThrow('Service Error');
  });

  it('should support passing and executing callback functions', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({
      executeCallback: async (cb: (msg: string) => Promise<string>) => {
        return await cb('called from service');
      },
    }));

    const client = createClient<{
      executeCallback: (cb: (msg: string) => string) => Promise<string>;
    }>(clientProvider, clientId);

    const callback = vi.fn((msg: string) => `received: ${msg}`);

    const result = await client.executeCallback(callback);

    expect(result).toBe('received: called from service');
    expect(callback).toHaveBeenCalledWith('called from service');
  });

  it('should throw when calling a non-existent function', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({}));

    const client = createClient<{ notExists: () => void }>(clientProvider, clientId);

    await expect(client.notExists()).rejects.toThrow('notExists is not a function');
  });

  it('should handle custom transformers', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    class CustomClass {
      constructor(public value: number) {}
    }

    const transformer = defineTransformer<CustomClass, number>('CustomClass', {
      isApplicable: (v: unknown): v is CustomClass => v instanceof CustomClass,
      serialize: (_provider, v) => v.value,
      deserialize: (_provider, v) => new CustomClass(v),
    });

    createService(serviceProvider, serviceId, [transformer], () => ({
      processCustom: (obj: CustomClass) => {
        return new CustomClass(obj.value * 2);
      },
    }));

    const client = createClient<{
      processCustom: (obj: CustomClass) => CustomClass;
    }>(clientProvider, clientId, [transformer]);

    const result = await client.processCustom(new CustomClass(21));
    expect(result).toBeInstanceOf(CustomClass);
    expect(result.value).toBe(42);
  });

  it('should throw timeout error if service is not ready', async () => {
    vi.useFakeTimers();

    const serviceId = uid();
    const clientId = uid();
    const { clientProvider } = createChannel(clientId, serviceId);

    const client = createClient<{ fn: () => void }>(clientProvider, clientId);

    const promise = client.fn();

    vi.advanceTimersByTime(5000);

    await expect(promise).rejects.toThrow(`The service was not ready in 5000 ms`);

    vi.useRealTimers();
  });

  it('should reject already registered services in same context', () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider } = createChannel(clientId, serviceId);

    createService(clientProvider, serviceId);

    expect(() => {
      createService(clientProvider, serviceId);
    }).toThrow(`Service "${serviceId}" is already registered in the current execution context.`);
  });

  it('should deliver repeated observable query updates across the proxy boundary', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);

    createService(serviceProvider, serviceId, [], () => ({
      query: defineObservableQuery(
        ({ path }: { path: string }) =>
          new Observable<string[]>((subscriber) => {
            subscriber.next([`${path}:initial`]);
            queueMicrotask(() => {
              subscriber.next([`${path}:updated`]);
            });

            return () => undefined;
          }),
      ),
    }));

    const client = createClient<{
      query: ReturnType<typeof defineObservableQuery<string[], { path: string }>>;
    }>(clientProvider, clientId);
    const scope = effectScope();
    const query = ref({
      path: '/drive',
    });
    const states: (readonly string[])[] = [];

    scope.run(() => {
      const { data } = useObservableQuery(client.query, query);

      watch(
        data,
        (value) => {
          if (value) {
            states.push(value);
          }
        },
        {
          immediate: true,
        },
      );
    });

    await vi.waitFor(() => {
      expect(states).toContainEqual(['/drive:updated']);
    });

    expect(states).toContainEqual(['/drive:initial']);

    scope.stop();
  });

  it('transfers ArrayBuffer values without SuperJSON byte arrays', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);
    createService(serviceProvider, serviceId, [], () => ({ echo: (value: ArrayBuffer) => value }));
    const client = createClient<{ echo: (value: ArrayBuffer) => ArrayBuffer }>(
      clientProvider,
      clientId,
    );
    const result = await client.echo(new Uint8Array([1, 2, 3]).buffer);

    expect([...new Uint8Array(result)]).toEqual([1, 2, 3]);
    expect(clientProvider.transferLists.some((list) => list.length === 1)).toBe(true);
  });

  it('transfers an exact Uint8Array view without unrelated backing-buffer bytes', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);
    createService(serviceProvider, serviceId, [], () => ({ echo: (value: Uint8Array) => value }));
    const client = createClient<{ echo: (value: Uint8Array) => Uint8Array }>(
      clientProvider,
      clientId,
    );
    const backing = new Uint8Array([9, 1, 2, 3, 8]);
    const result = await client.echo(backing.subarray(1, 4));

    expect([...result]).toEqual([1, 2, 3]);
    expect(result.byteOffset).toBe(0);
    expect(result.byteLength).toBe(3);
  });

  it('preserves graph identity and user marker-shaped objects while deduplicating buffers', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);
    createService(serviceProvider, serviceId, transformers, () => ({
      echo: (value: unknown) => value,
    }));
    const client = createClient<{ echo: (value: unknown) => unknown }>(
      clientProvider,
      clientId,
      transformers,
    );
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    const shared = { label: 'shared' };
    const value: Record<string, unknown> = {
      __proxyTransferable: 'arrayBuffer',
      index: 17,
      first: shared,
      second: shared,
      buffer,
      repeatedBuffer: buffer,
      map: new Map([['binary', buffer]]),
      set: new Set([shared]),
    };
    value.self = value;

    const result = (await client.echo(value)) as typeof value;

    expect(result.self).toBe(result);
    expect(result.first).toBe(result.second);
    expect(result).toMatchObject({ __proxyTransferable: 'arrayBuffer', index: 17 });
    const mappedBuffer = (result.map as Map<string, ArrayBuffer>).get('binary');
    expect(mappedBuffer).toBeInstanceOf(ArrayBuffer);
    expect(new Uint8Array(mappedBuffer ?? new ArrayBuffer(0))).toEqual(new Uint8Array([1, 2, 3]));
    expect(new Uint8Array(result.buffer as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]));
    const requestTransfers = clientProvider.transferLists.find((list) => list.includes(buffer));
    expect(requestTransfers).toEqual([buffer]);
  });

  it('transfers exact binary callback arguments through the real callback transport', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(clientId, serviceId);
    createService(serviceProvider, serviceId, transformers, () => ({
      call: async (callback: (value: Uint8Array) => Promise<number>) =>
        callback(new Uint8Array([4, 5, 6])),
    }));
    const client = createClient<{
      call: (callback: (value: Uint8Array) => number) => Promise<number>;
    }>(clientProvider, clientId, transformers);
    const callback = vi.fn((value: Uint8Array) => value.byteLength);

    await expect(client.call(callback)).resolves.toBe(3);
    expect(callback.mock.calls[0]?.[0]).toEqual(new Uint8Array([4, 5, 6]));
    expect(
      [...clientProvider.transferLists, ...serviceProvider.transferLists].some(
        (list) => list.length === 1,
      ),
    ).toBe(true);
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions -- structured-clone harness ends */
