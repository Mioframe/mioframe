import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT, generateViewId } from '@shared/lib/databaseDocument';
import { setupDatabaseViewsService } from './databaseViewsService';

const createDocumentId = () => new Repo({}).create({}).documentId;

const createChangeDatabase = (stateSubject: BehaviorSubject<DatabaseState | undefined>) =>
  vi.fn((_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
    const state = stateSubject.value;

    if (!state) {
      throw new Error('state is undefined');
    }

    try {
      callback(state);
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }

    stateSubject.next({
      ...state,
      views: {
        ...state.views,
      },
    });

    return Promise.resolve();
  });

describe('setupDatabaseViewsService', () => {
  it('creates new views after the current ordered views', async () => {
    const defaultViewId = generateViewId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {},
      properties: {},
      views: {
        [defaultViewId]: {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'default view',
          order: 0,
        },
      },
    });

    const changeDatabase = createChangeDatabase(stateSubject);

    const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
    const documentId = createDocumentId();

    const createdViewId = await service.create('/db', documentId, {
      layout: DB_VIEW_LAYOUT.TABLE,
      name: 'descending targets',
    });

    expect(stateSubject.value?.views[defaultViewId]?.order).toBe(0);
    expect(stateSubject.value?.views[createdViewId]?.order).toBe(1);
    await expect(service.viewList.fetch({ documentId, path: '/db' })).resolves.toEqual([
      [
        defaultViewId,
        {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'default view',
          order: 0,
        },
      ],
      [
        createdViewId,
        {
          layout: DB_VIEW_LAYOUT.TABLE,
          name: 'descending targets',
          order: 1,
        },
      ],
    ]);
  });

  describe('reorder', () => {
    const createThreeViewState = () => {
      const viewAId = generateViewId();
      const viewBId = generateViewId();
      const viewCId = generateViewId();

      const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
        version: 3,
        data: {},
        properties: {},
        views: {
          [viewAId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'A', order: 0 },
          [viewBId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'B', order: 1 },
          [viewCId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'C', order: 2 },
        },
      });

      return { stateSubject, viewAId, viewBId, viewCId };
    };

    it('applies the target order and returns applied when the expected order matches', async () => {
      const { stateSubject, viewAId, viewBId, viewCId } = createThreeViewState();
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const result = await service.reorder('/db', documentId, {
        expectedOrderedIds: [viewAId, viewBId, viewCId],
        orderedIds: [viewCId, viewAId, viewBId],
      });

      expect(result).toBe('applied');
      expect(stateSubject.value?.views[viewCId]?.order).toBe(0);
      expect(stateSubject.value?.views[viewAId]?.order).toBe(1);
      expect(stateSubject.value?.views[viewBId]?.order).toBe(2);
    });

    it('returns stale without mutating when the current order no longer matches expectedOrderedIds', async () => {
      const { stateSubject, viewAId, viewBId, viewCId } = createThreeViewState();
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const result = await service.reorder('/db', documentId, {
        expectedOrderedIds: [viewBId, viewAId, viewCId],
        orderedIds: [viewCId, viewBId, viewAId],
      });

      expect(result).toBe('stale');
      expect(stateSubject.value?.views[viewAId]?.order).toBe(0);
      expect(stateSubject.value?.views[viewBId]?.order).toBe(1);
      expect(stateSubject.value?.views[viewCId]?.order).toBe(2);
    });

    it('returns stale without mutating when view membership changed underneath', async () => {
      const { stateSubject, viewAId, viewBId, viewCId } = createThreeViewState();
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();
      const removedId = generateViewId();

      const result = await service.reorder('/db', documentId, {
        expectedOrderedIds: [viewAId, viewBId, viewCId, removedId],
        orderedIds: [viewCId, viewBId, viewAId, removedId],
      });

      expect(result).toBe('stale');
      expect(stateSubject.value?.views[viewAId]?.order).toBe(0);
      expect(stateSubject.value?.views[viewBId]?.order).toBe(1);
      expect(stateSubject.value?.views[viewCId]?.order).toBe(2);
    });

    it('does not partially mutate the document when orderedIds is not a permutation of the expected ids', async () => {
      const { stateSubject, viewAId, viewBId, viewCId } = createThreeViewState();
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();
      const foreignId = generateViewId();

      await expect(
        service.reorder('/db', documentId, {
          expectedOrderedIds: [viewAId, viewBId, viewCId],
          orderedIds: [viewAId, viewBId, foreignId],
        }),
      ).rejects.toThrow();

      expect(stateSubject.value?.views[viewAId]?.order).toBe(0);
      expect(stateSubject.value?.views[viewBId]?.order).toBe(1);
      expect(stateSubject.value?.views[viewCId]?.order).toBe(2);
    });

    it('keeps the applied order observable through the canonical view-list query', async () => {
      const { stateSubject, viewAId, viewBId, viewCId } = createThreeViewState();
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      await service.reorder('/db', documentId, {
        expectedOrderedIds: [viewAId, viewBId, viewCId],
        orderedIds: [viewBId, viewCId, viewAId],
      });

      const viewList = await service.viewList.fetch({ documentId, path: '/db' });

      if (viewList instanceof Error || !viewList) {
        throw viewList ?? new Error('viewList is undefined');
      }

      expect(viewList.map(([id]) => id)).toEqual([viewBId, viewCId, viewAId]);
    });
  });

  describe('legacy views without an explicit order', () => {
    it('treats a single view with no order as if its order were 0', async () => {
      const legacyId = generateViewId();
      const orderedId = generateViewId();
      const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
        version: 3,
        data: {},
        properties: {},
        views: {
          [orderedId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'ordered', order: 5 },
          [legacyId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'legacy' },
        },
      });
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const viewList = await service.viewList.fetch({ documentId, path: '/db' });

      if (viewList instanceof Error || !viewList) {
        throw viewList ?? new Error('viewList is undefined');
      }

      expect(viewList.map(([id]) => id)).toEqual([legacyId, orderedId]);
    });

    it('keeps a deterministic relative order for multiple views with no order', async () => {
      const legacyFirstId = generateViewId();
      const legacySecondId = generateViewId();
      const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
        version: 3,
        data: {},
        properties: {},
        views: {
          [legacyFirstId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'legacy first' },
          [legacySecondId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'legacy second' },
        },
      });
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const viewList = await service.viewList.fetch({ documentId, path: '/db' });

      if (viewList instanceof Error || !viewList) {
        throw viewList ?? new Error('viewList is undefined');
      }

      expect(viewList.map(([id]) => id)).toEqual([legacyFirstId, legacySecondId]);
    });

    it('interleaves a mixture of ordered and unordered views by the same effective rank', async () => {
      const orderOneId = generateViewId();
      const legacyId = generateViewId();
      const explicitZeroId = generateViewId();
      const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
        version: 3,
        data: {},
        properties: {},
        views: {
          [orderOneId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'order one', order: 1 },
          [legacyId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'legacy' },
          [explicitZeroId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'explicit zero', order: 0 },
        },
      });
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const viewList = await service.viewList.fetch({ documentId, path: '/db' });

      if (viewList instanceof Error || !viewList) {
        throw viewList ?? new Error('viewList is undefined');
      }

      // legacy (no order) and explicitZero (order: 0) share the same effective rank and keep
      // their relative record order; orderOneId sorts after both.
      expect(viewList.map(([id]) => id)).toEqual([legacyId, explicitZeroId, orderOneId]);
    });

    it('reorders a legacy document when expectedOrderedIds matches the order emitted by viewList', async () => {
      const legacyId = generateViewId();
      const orderedId = generateViewId();
      const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
        version: 3,
        data: {},
        properties: {},
        views: {
          [orderedId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'ordered', order: 1 },
          [legacyId]: { layout: DB_VIEW_LAYOUT.TABLE, name: 'legacy' },
        },
      });
      const changeDatabase = createChangeDatabase(stateSubject);
      const service = setupDatabaseViewsService(() => stateSubject.asObservable(), changeDatabase);
      const documentId = createDocumentId();

      const initialViewList = await service.viewList.fetch({ documentId, path: '/db' });
      if (initialViewList instanceof Error || !initialViewList) {
        throw initialViewList ?? new Error('viewList is undefined');
      }
      const expectedOrderedIds = initialViewList.map(([id]) => id);

      expect(expectedOrderedIds).toEqual([legacyId, orderedId]);

      const result = await service.reorder('/db', documentId, {
        expectedOrderedIds,
        orderedIds: [orderedId, legacyId],
      });

      expect(result).toBe('applied');

      const viewListAfterReorder = await service.viewList.fetch({ documentId, path: '/db' });
      if (viewListAfterReorder instanceof Error || !viewListAfterReorder) {
        throw viewListAfterReorder ?? new Error('viewList is undefined');
      }

      expect(viewListAfterReorder.map(([id]) => id)).toEqual([orderedId, legacyId]);
    });
  });
});
