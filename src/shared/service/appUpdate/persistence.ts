import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { releaseControllerStateSchema, RELEASE_CONTROLLER_SCHEMA_VERSION } from './contracts';
import { createInitialReleaseControllerState, migrateReleaseControllerState } from './stateMachine';

const DATABASE_NAME = 'mioframe-stable-release-controller';
const STORE_NAME = 'controller-state';
const CURRENT_KEY = 'current';
const LAST_KNOWN_GOOD_KEY = 'last-known-good';
const LEGACY_KEY = 'state';

/** Private typed failure for controller persistence compatibility and recovery. */
export class ReleaseControllerPersistenceError extends Error {
  /**
   * Create a persistence failure without exposing stored data.
   * @param reason - Stable private failure category.
   * @param options - Original storage failure when available.
   */
  constructor(
    /** Stable private failure category. */
    readonly reason: 'unsupportedSchema' | 'unrecoverable' | 'writeFailed',
    /** Original storage failure when available. */
    options?: ErrorOptions,
  ) {
    super(`Release controller persistence ${reason}.`, options);
  }
}

/** Private durable controller-state store boundary. */
export type ReleaseControllerStateStore = {
  /** Read, migrate, or recover controller state for the served release. */
  read(currentRelease: ReleaseIdentity): Promise<ReleaseControllerState>;
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
    const request = indexedDB.open(DATABASE_NAME, 2);
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

const parseStored = (
  value: unknown,
  currentRelease: ReleaseIdentity,
): ReleaseControllerState | undefined => {
  const parsed = releaseControllerStateSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  return migrateReleaseControllerState(value, currentRelease);
};

const getSchemaVersion = (value: unknown): unknown =>
  typeof value === 'object' && value !== null ? Reflect.get(value, 'schemaVersion') : undefined;

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
      throw new ReleaseControllerPersistenceError('writeFailed', { cause: error });
    } finally {
      database.close();
    }
  };
  return {
    async read(currentRelease) {
      const database = await openDatabase();
      let current: unknown;
      let lkg: unknown;
      let legacy: unknown;
      try {
        const objectStore = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
        [current, lkg, legacy] = await Promise.all([
          requestResult(objectStore.get(CURRENT_KEY)),
          requestResult(objectStore.get(LAST_KNOWN_GOOD_KEY)),
          requestResult(objectStore.get(LEGACY_KEY)),
        ]);
        if (current === undefined) current = legacy;
      } finally {
        database.close();
      }
      if (current === undefined) {
        const initial = createInitialReleaseControllerState(currentRelease);
        await write(initial);
        return initial;
      }
      if (
        typeof current === 'object' &&
        current !== null &&
        'schemaVersion' in current &&
        typeof current.schemaVersion === 'number' &&
        current.schemaVersion > RELEASE_CONTROLLER_SCHEMA_VERSION
      ) {
        throw new ReleaseControllerPersistenceError('unsupportedSchema');
      }
      const parsed = parseStored(current, currentRelease);
      if (parsed) {
        if (getSchemaVersion(current) !== RELEASE_CONTROLLER_SCHEMA_VERSION) {
          await write(parsed);
        }
        return parsed;
      }
      const recovered = parseStored(lkg, currentRelease);
      if (!recovered) throw new ReleaseControllerPersistenceError('unrecoverable');
      await write(recovered);
      return recovered;
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
        const initial = createInitialReleaseControllerState(currentRelease);
        current = initial;
        lkg = structuredClone(initial);
        return initial;
      }
      if (
        typeof current === 'object' &&
        current !== null &&
        'schemaVersion' in current &&
        typeof current.schemaVersion === 'number' &&
        current.schemaVersion > RELEASE_CONTROLLER_SCHEMA_VERSION
      )
        throw new ReleaseControllerPersistenceError('unsupportedSchema');
      const parsed = parseStored(current, currentRelease) ?? parseStored(lkg, currentRelease);
      if (!parsed) throw new ReleaseControllerPersistenceError('unrecoverable');
      current = structuredClone(parsed);
      lkg = structuredClone(parsed);
      return parsed;
    },
    write(state) {
      current = structuredClone(state);
      lkg = structuredClone(state);
      return Promise.resolve();
    },
  };
};
