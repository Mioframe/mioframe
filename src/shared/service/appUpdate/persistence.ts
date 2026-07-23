import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { releaseControllerStateSchema, RELEASE_CONTROLLER_SCHEMA_VERSION } from './contracts';
import { createInitialReleaseControllerState } from './stateMachine';

const DATABASE_NAME = 'mioframe-stable-release-controller';
const STORE_NAME = 'controller-state';
const CURRENT_KEY = 'current';
const LAST_KNOWN_GOOD_KEY = 'last-known-good';

/** Private typed failure for a controller-state write. */
export class ReleaseControllerPersistenceError extends Error {
  /**
   * Create a write failure without exposing stored data.
   * @param options - Original storage failure when available.
   */
  constructor(options?: ErrorOptions) {
    super('Release controller persistence write failed.', options);
  }
}

/** Result of reading durable controller state, including whether it could be read at all. */
export type ReleaseControllerStateRead = {
  /** Usable controller state for this session, recovered or freshly initialized when necessary. */
  state: ReleaseControllerState;
  /** Whether the durable record itself was actually read/recovered this session. */
  capability: 'available' | 'unavailable';
};

/** Private durable controller-state store boundary. */
export type ReleaseControllerStateStore = {
  /**
   * Read controller state for the served release.
   *
   * Never throws: an absent record initializes a fresh Automatic state; an unsupported newer
   * schema or an unrecoverable record both yield a fresh in-memory fallback with
   * `capability: 'unavailable'` rather than rejecting, so a broken persistence layer can never
   * block application navigation.
   */
  read(currentRelease: ReleaseIdentity): Promise<ReleaseControllerStateRead>;
  /** Atomically update current and last-known-good records. */
  write(state: ReleaseControllerState): Promise<void>;
};

const requestResult = <Result>(request: IDBRequest<Result>): Promise<Result> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'));
    };
  });

const transactionComplete = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };
    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
    };
    transaction.onerror = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    };
  });

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 3);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME))
        request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB open failed.'));
    };
  });

const isUnsupportedSchema = (value: unknown): boolean =>
  typeof value === 'object' &&
  value !== null &&
  'schemaVersion' in value &&
  typeof value.schemaVersion === 'number' &&
  value.schemaVersion > RELEASE_CONTROLLER_SCHEMA_VERSION;

/**
 * Create the dedicated IndexedDB controller store.
 * @returns Durable current and last-known-good state store.
 */
export const createReleaseControllerStateStore = (): ReleaseControllerStateStore => {
  const write = async (state: ReleaseControllerState): Promise<void> => {
    const database = await openDatabase();
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      objectStore.put(state, CURRENT_KEY);
      objectStore.put(state, LAST_KNOWN_GOOD_KEY);
      await transactionComplete(transaction);
    } catch (error) {
      throw new ReleaseControllerPersistenceError({ cause: error });
    } finally {
      database.close();
    }
  };
  return {
    async read(currentRelease) {
      let current: unknown;
      let lkg: unknown;
      try {
        const database = await openDatabase();
        try {
          const objectStore = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
          [current, lkg] = await Promise.all([
            requestResult(objectStore.get(CURRENT_KEY)),
            requestResult(objectStore.get(LAST_KNOWN_GOOD_KEY)),
          ]);
        } finally {
          database.close();
        }
      } catch {
        return {
          state: createInitialReleaseControllerState(currentRelease),
          capability: 'unavailable',
        };
      }
      if (current === undefined) {
        const initial = createInitialReleaseControllerState(currentRelease);
        try {
          await write(initial);
        } catch {
          // The initial record still serves this session even if it could not be persisted.
        }
        return { state: initial, capability: 'available' };
      }
      if (isUnsupportedSchema(current)) {
        return {
          state: createInitialReleaseControllerState(currentRelease),
          capability: 'unavailable',
        };
      }
      const parsed = releaseControllerStateSchema.safeParse(current);
      if (parsed.success) return { state: parsed.data, capability: 'available' };
      const recovered = releaseControllerStateSchema.safeParse(lkg);
      if (recovered.success) {
        try {
          await write(recovered.data);
        } catch {
          // The recovered record still serves this session even if it could not be re-persisted.
        }
        return { state: recovered.data, capability: 'available' };
      }
      return {
        state: createInitialReleaseControllerState(currentRelease),
        capability: 'unavailable',
      };
    },
    write,
  };
};

/**
 * Create the deterministic controller store used by sibling tests.
 * @param initial - Initial current record.
 * @param lastKnownGood - Initial recovery record.
 * @returns In-memory store with an inspection seam.
 */
export const createMemoryReleaseControllerStateStore = (
  initial?: unknown,
  lastKnownGood?: unknown,
): ReleaseControllerStateStore & { current(): unknown } => {
  let current = initial;
  let lkg = lastKnownGood;
  return {
    current: () => current,
    async read(currentRelease) {
      await Promise.resolve();
      if (current === undefined) {
        const freshState = createInitialReleaseControllerState(currentRelease);
        current = structuredClone(freshState);
        lkg = structuredClone(freshState);
        return { state: freshState, capability: 'available' };
      }
      if (isUnsupportedSchema(current)) {
        return {
          state: createInitialReleaseControllerState(currentRelease),
          capability: 'unavailable',
        };
      }
      const parsed = releaseControllerStateSchema.safeParse(current);
      if (parsed.success) {
        current = structuredClone(parsed.data);
        lkg = structuredClone(parsed.data);
        return { state: parsed.data, capability: 'available' };
      }
      const recovered = releaseControllerStateSchema.safeParse(lkg);
      if (recovered.success) {
        current = structuredClone(recovered.data);
        lkg = structuredClone(recovered.data);
        return { state: recovered.data, capability: 'available' };
      }
      return {
        state: createInitialReleaseControllerState(currentRelease),
        capability: 'unavailable',
      };
    },
    write(state) {
      current = structuredClone(state);
      lkg = structuredClone(state);
      return Promise.resolve();
    },
  };
};
