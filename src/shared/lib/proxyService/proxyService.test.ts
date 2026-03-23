import { describe, it, expect, vi } from 'vitest';
import { createClient, createService } from './proxyService';
import { defineTransformer } from './defineTransformer';
import type { Provider } from './types';
import { uid } from 'uid/secure';

class MockProvider implements Provider {
  private listeners: Set<(p: { data: unknown }) => unknown> = new Set();
  public peer: MockProvider | null = null;
  public delay = 0;

  constructor(
    public myId: string,
    public peerId: string,
  ) {}

  postMessage(data: unknown) {
    if (!this.peer) return;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Safe to assume JSON structure
    const payload = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

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

  addEventListener(
    _type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ) {
    this.listeners.add(handler);
  }

  removeEventListener(
    _type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ) {
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
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

    createService(serviceProvider, serviceId, [], () => ({
      greet: (name: string) => `Hello, ${name}`,
    }));

    const client = createClient<{ greet: (name: string) => string }>(
      clientProvider,
      clientId,
    );

    const result = await client.greet('World');
    expect(result).toBe('Hello, World');
  });

  it('should support deep path property access', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

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
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

    createService(serviceProvider, serviceId, [], () => ({
      throwError: () => {
        throw new Error('Service Error');
      },
    }));

    const client = createClient<{ throwError: () => void }>(
      clientProvider,
      clientId,
    );

    await expect(client.throwError()).rejects.toThrow('Service Error');
  });

  it('should support passing and executing callback functions', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

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
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

    createService(serviceProvider, serviceId, [], () => ({}));

    const client = createClient<{ notExists: () => void }>(
      clientProvider,
      clientId,
    );

    await expect(client.notExists()).rejects.toThrow(
      'notExists is not a function',
    );
  });

  it('should handle custom transformers', async () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider, serviceProvider } = createChannel(
      clientId,
      serviceId,
    );

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

    await expect(promise).rejects.toThrow(
      `The service was not ready in 5000 ms`,
    );

    vi.useRealTimers();
  });

  it('should reject already registered services in same context', () => {
    const serviceId = uid();
    const clientId = uid();
    const { clientProvider } = createChannel(clientId, serviceId);

    createService(clientProvider, serviceId);

    expect(() => {
      createService(clientProvider, serviceId);
    }).toThrow(
      `Service "${serviceId}" is already registered in the current execution context.`,
    );
  });
});
