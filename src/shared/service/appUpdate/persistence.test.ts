import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseIdentity } from './contracts';
import {
  createMemoryReleaseControllerStateStore,
  createReleaseControllerStateStore,
} from './persistence';
import { createInitialReleaseControllerState } from './stateMachine';

type FakeIdbRequest = {
  onsuccess?: () => void;
  onerror?: () => void;
  result?: unknown;
};

type FakeIdbTransaction = {
  onabort?: () => void;
  objectStore: (name: string) => { get: () => FakeIdbRequest; put: () => FakeIdbRequest };
};

type FakeIdbDatabase = {
  objectStoreNames: { contains: (name: string) => boolean };
  transaction: (storeName: string, mode: string) => FakeIdbTransaction;
  close: () => void;
};

/**
 * A minimal fake `indexedDB` whose `readwrite` transactions always abort, reproducing a durable
 * write failure (e.g. quota exceeded) against the real IndexedDB-backed store without depending on
 * a real browser IndexedDB implementation in the Vitest (Node) environment.
 * @returns A fake `indexedDB`-shaped object exposing only the `open` method the store uses.
 */
const createIndexedDbThatFailsToWrite = () => {
  const open = (): FakeIdbRequest => {
    const request: FakeIdbRequest = {};
    queueMicrotask(() => {
      const database: FakeIdbDatabase = {
        objectStoreNames: { contains: () => true },
        transaction: (_storeName, mode) => {
          const transaction: FakeIdbTransaction = {
            objectStore: () => ({
              get: () => {
                const getRequest: FakeIdbRequest = {};
                queueMicrotask(() => {
                  getRequest.onsuccess?.();
                });
                return getRequest;
              },
              put: () => ({}),
            }),
          };
          if (mode === 'readwrite') {
            queueMicrotask(() => {
              transaction.onabort?.();
            });
          }
          return transaction;
        },
        close: () => {},
      };
      request.result = database;
      request.onsuccess?.();
    });
    return request;
  };
  return { open };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

const current: ReleaseIdentity = {
  releaseId: 'a'.repeat(40),
  releaseSequence: 3,
  appVersion: '1.0.0',
  buildId: 'aaaaaaa',
  buildDate: '2026-07-23T00:00:00.000Z',
};

describe('release persistence recovery', () => {
  it('initializes only an absent record as a fresh Automatic state', async () => {
    const read = await createMemoryReleaseControllerStateStore().read(current);
    expect(read).toMatchObject({
      capability: 'available',
      state: { mode: 'automatic', activeRelease: current },
    });
  });

  it('never throws: an unsupported newer schema stays untouched and reports capability unavailable', async () => {
    const store = createMemoryReleaseControllerStateStore({ schemaVersion: 99 });
    const read = await store.read(current);
    expect(read.capability).toBe('unavailable');
    expect(read.state).toMatchObject({ mode: 'automatic', activeRelease: current });
    expect(store.current()).toEqual({ schemaVersion: 99 });
  });

  it('recovers malformed current from last-known-good without losing a Manual pin', async () => {
    const manual = {
      ...createInitialReleaseControllerState(current),
      mode: 'manual' as const,
      pinnedRelease: current,
    };
    const store = createMemoryReleaseControllerStateStore({ malformed: true }, manual);
    const read = await store.read(current);
    expect(read).toMatchObject({
      capability: 'available',
      state: { mode: 'manual', pinnedRelease: current },
    });
  });

  it('never throws and never silently changes mode when neither record recovers', async () => {
    const store = createMemoryReleaseControllerStateStore(
      { malformed: true },
      { alsoMalformed: true },
    );
    const read = await store.read(current);
    expect(read).toMatchObject({
      capability: 'unavailable',
      state: { mode: 'automatic', activeRelease: current },
    });
  });

  it('disables capability, without disabling the application, when the initial state cannot be durably written', async () => {
    vi.stubGlobal('indexedDB', createIndexedDbThatFailsToWrite());
    const read = await createReleaseControllerStateStore().read(current);
    expect(read.capability).toBe('unavailable');
    expect(read.state).toMatchObject({ mode: 'automatic', activeRelease: current });
  });
});
