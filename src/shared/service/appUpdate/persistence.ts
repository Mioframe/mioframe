/* eslint-disable jsdoc/require-jsdoc -- Dedicated store methods are fully described by ReleaseControllerStateStore. */
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { migrateReleaseControllerState, createInitialReleaseControllerState } from './stateMachine';

const DATABASE_NAME = 'mioframe-stable-release-controller';
const STORE_NAME = 'controller-state';
const STATE_KEY = 'state';

export type ReleaseControllerStateStore = {
  read(currentRelease: ReleaseIdentity): Promise<ReleaseControllerState>;
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

const openDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      resolve(request.result);
    };
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB open failed.'));
    };
  });

export const createReleaseControllerStateStore = (): ReleaseControllerStateStore => ({
  async read(currentRelease) {
    const database = await openDatabase();
    try {
      const value = await requestResult(
        database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(STATE_KEY),
      );
      const state = migrateReleaseControllerState(value, currentRelease);
      if (value === undefined) {
        await this.write(state);
      }
      return state;
    } finally {
      database.close();
    }
  },
  async write(state) {
    const database = await openDatabase();
    try {
      await requestResult(
        database.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(state, STATE_KEY),
      );
    } finally {
      database.close();
    }
  },
});

export const createMemoryReleaseControllerStateStore = (
  initial?: unknown,
): ReleaseControllerStateStore & { current(): unknown } => {
  let value = initial;
  return {
    current: () => value,
    read(currentRelease) {
      if (value === undefined) value = createInitialReleaseControllerState(currentRelease);
      return Promise.resolve(migrateReleaseControllerState(value, currentRelease));
    },
    write(state) {
      value = structuredClone(state);
      return Promise.resolve();
    },
  };
};
/* eslint-enable jsdoc/require-jsdoc -- End dedicated state-store implementations. */
