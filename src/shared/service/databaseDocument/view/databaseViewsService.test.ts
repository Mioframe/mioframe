import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT, generateViewId, type DatabaseViewId } from '@shared/lib/databaseDocument';
import { setupDatabaseViewsService } from './databaseViewsService';

const createDocumentId = () => new Repo({}).create({}).documentId;

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const createViewsState = (ids: readonly DatabaseViewId[]): DatabaseState => ({
  version: 3,
  data: {},
  properties: {},
  views: Object.fromEntries(
    ids.map((id, index) => [
      id,
      {
        layout: DB_VIEW_LAYOUT.TABLE,
        name: `view-${index}`,
        order: index,
      },
    ]),
  ),
});

const createHarness = (initialIds: readonly DatabaseViewId[]) => {
  const stateSubject = new BehaviorSubject<DatabaseState | undefined>(createViewsState(initialIds));
  const operations: Array<{
    deferred: Deferred<unknown>;
    path: string;
    documentId: string;
  }> = [];

  const changeDatabase = vi.fn(
    (path: string, documentId: string, callback: (state: DatabaseState) => unknown) => {
      const state = stateSubject.value;
      if (!state) throw new Error('state is undefined');

      callback(state);
      stateSubject.next({
        ...state,
        views: {
          ...state.views,
        },
      });

      const deferred = createDeferred<unknown>();
      operations.push({ deferred, path, documentId });
      return deferred.promise;
    },
  );

  const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);

  return { service, stateSubject, changeDatabase, operations };
};

const getOrderedViewEntries = (
  state: DatabaseState | undefined,
): Array<readonly [string, number]> =>
  Object.entries(state?.views ?? {})
    .sort((left, right) => (left[1]?.order ?? 0) - (right[1]?.order ?? 0))
    .map(([id, view]) => [id, view?.order ?? 0] as const);

const getOrderedViewIds = (state: DatabaseState | undefined): string[] =>
  getOrderedViewEntries(state).map(([id]) => id);

describe('setupDatabaseViewsService reorder sequencing', () => {
  it('does not start a second reorder for the same document before the first settles', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, changeDatabase, operations } = createHarness([a, b]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a]);
    const secondPromise = service.reorder('/db', documentId, [a, b]);
    await Promise.resolve();

    expect(changeDatabase).toHaveBeenCalledTimes(1);

    operations[0]?.deferred.resolve(undefined);
    await firstPromise;
    await Promise.resolve();

    expect(changeDatabase).toHaveBeenCalledTimes(2);

    operations[1]?.deferred.resolve(undefined);
    await secondPromise;
  });

  it('starts the second reorder after the first succeeds', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, changeDatabase, operations } = createHarness([a, b]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a]);
    const secondPromise = service.reorder('/db', documentId, [a, b]);
    await Promise.resolve();

    operations[0]?.deferred.resolve('first');
    await firstPromise;
    await Promise.resolve();

    expect(changeDatabase).toHaveBeenCalledTimes(2);

    operations[1]?.deferred.resolve('second');
    await expect(secondPromise).resolves.toBe('second');
  });

  it('starts the second reorder after the first rejects', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, changeDatabase, operations } = createHarness([a, b]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a]);
    const secondPromise = service.reorder('/db', documentId, [a, b]);
    await Promise.resolve();

    operations[0]?.deferred.reject(new Error('first failed'));
    await expect(firstPromise).rejects.toThrow('first failed');
    await Promise.resolve();

    expect(changeDatabase).toHaveBeenCalledTimes(2);

    operations[1]?.deferred.resolve('second');
    await expect(secondPromise).resolves.toBe('second');
  });

  it('returned promises correspond to their own operations', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, operations } = createHarness([a, b]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a]);
    const secondPromise = service.reorder('/db', documentId, [a, b]);
    await Promise.resolve();

    operations[0]?.deferred.reject(new Error('first failed'));
    await expect(firstPromise).rejects.toThrow('first failed');
    await Promise.resolve();

    operations[1]?.deferred.resolve('second ok');
    await expect(secondPromise).resolves.toBe('second ok');
  });

  it('does not serialize reorders for different documents behind each other', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, changeDatabase, operations } = createHarness([a, b]);
    const documentIdA = createDocumentId();
    const documentIdB = createDocumentId();

    const firstPromise = service.reorder('/db', documentIdA, [b, a]);
    const secondPromise = service.reorder('/db', documentIdB, [a, b]);
    await Promise.resolve();

    expect(changeDatabase).toHaveBeenCalledTimes(2);

    operations[0]?.deferred.resolve(undefined);
    operations[1]?.deferred.resolve(undefined);
    await firstPromise;
    await secondPromise;
  });

  it('cleans the queue tail after the final completion', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const { service, changeDatabase, operations } = createHarness([a, b]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a]);
    await Promise.resolve();
    operations[0]?.deferred.resolve(undefined);
    await firstPromise;
    await Promise.resolve();

    const secondPromise = service.reorder('/db', documentId, [a, b]);
    await Promise.resolve();
    expect(changeDatabase).toHaveBeenCalledTimes(2);

    operations[1]?.deferred.resolve(undefined);
    await secondPromise;
    await Promise.resolve();

    const thirdPromise = service.reorder('/db', documentId, [b, a]);
    await Promise.resolve();
    expect(changeDatabase).toHaveBeenCalledTimes(3);

    operations[2]?.deferred.resolve(undefined);
    await thirdPromise;
  });

  it('preserves reorder normalization and contiguous order values', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const c = generateViewId();
    const { service, stateSubject, operations } = createHarness([a, b, c]);
    const documentId = createDocumentId();

    const promise = service.reorder('/db', documentId, [c, generateViewId(), a]);
    await Promise.resolve();

    expect(getOrderedViewEntries(stateSubject.value)).toEqual([
      [c, 0],
      [a, 1],
      [b, 2],
    ]);

    operations[0]?.deferred.resolve(undefined);
    await promise;
  });

  it('snapshots orderedIds so caller mutation does not affect a queued reorder', async () => {
    const a = generateViewId();
    const b = generateViewId();
    const c = generateViewId();
    const { service, stateSubject, operations } = createHarness([a, b, c]);
    const documentId = createDocumentId();

    const firstPromise = service.reorder('/db', documentId, [b, a, c]);
    const secondInput = [c, a, b];
    const secondPromise = service.reorder('/db', documentId, secondInput);
    await Promise.resolve();

    secondInput.splice(0, secondInput.length, a, b, c);

    operations[0]?.deferred.resolve(undefined);
    await firstPromise;
    await Promise.resolve();

    expect(getOrderedViewIds(stateSubject.value)).toEqual([c, a, b]);

    operations[1]?.deferred.resolve(undefined);
    await secondPromise;
  });
});
