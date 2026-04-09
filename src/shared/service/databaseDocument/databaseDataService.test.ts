import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DatabaseFilter, DatabaseSortMap, DatabaseState } from '@shared/lib/databaseDocument';
import { SORT_DIRECTION, generateItemId, generatePropertyId } from '@shared/lib/databaseDocument';

const filterSubject = new BehaviorSubject<DatabaseFilter | undefined>(undefined);
const sortingSubject = new BehaviorSubject<DatabaseSortMap | undefined>(undefined);

vi.mock('./view/databaseViewsService', () => ({
  setupDatabaseViewsService: () => ({
    filter: {
      filter$: () => filterSubject.asObservable(),
    },
    sorting: {
      databaseSorting$: () => sortingSubject.asObservable(),
    },
  }),
}));

describe('setupDatabaseDataService', () => {
  beforeEach(() => {
    filterSubject.next(undefined);
    sortingSubject.next(undefined);
  });

  it('returns effective values from the background service', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: {},
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(() => stateSubject.asObservable(), vi.fn());
    const documentId = new Repo({}).create({}).documentId;

    await expect(
      service.databaseEffectiveValue.fetch({
        documentId,
        itemId,
        path: '/db',
        propertyId: titlePropertyId,
      }),
    ).resolves.toBe('untitled');
  });

  it('recomputes filtered ids when only property defaults change', async () => {
    const titlePropertyId = generatePropertyId();
    const sparseItemId = generateItemId();
    const explicitItemId = generateItemId();

    sortingSubject.next({
      [titlePropertyId]: {
        direction: SORT_DIRECTION.ascending,
        priority: 0,
      },
    });

    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [sparseItemId]: {},
        [explicitItemId]: { [titlePropertyId]: 'z' },
      },
      properties: {
        [titlePropertyId]: {
          default: 'z',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(() => stateSubject.asObservable(), vi.fn());
    const documentId = new Repo({}).create({}).documentId;

    const emissionPromise = new Promise<string[]>((resolve) => {
      let emissionCount = 0;
      const expectedIdList = [sparseItemId, explicitItemId];

      void service.filteredIdList.subscribe({
        query: {
          documentId,
          options: {},
          path: '/db',
        },
        next: (value) => {
          emissionCount += 1;

          if (emissionCount === 1) {
            stateSubject.next({
              version: 3,
              data: {
                [sparseItemId]: {},
                [explicitItemId]: { [titlePropertyId]: 'z' },
              },
              properties: {
                [titlePropertyId]: {
                  default: 'a',
                  name: 'Title',
                  type: 'string',
                },
              },
              views: {},
            });
            return;
          }

          if (
            value &&
            value.length === expectedIdList.length &&
            value.every((itemId, index) => itemId === expectedIdList[index])
          ) {
            resolve(value);
          }
        },
      });
    });

    await expect(emissionPromise).resolves.toEqual([sparseItemId, explicitItemId]);
  });

  it('sorts filtered ids by effective default-aware values', async () => {
    const titlePropertyId = generatePropertyId();
    const sparseItemId = generateItemId();
    const explicitItemId = generateItemId();

    sortingSubject.next({
      [titlePropertyId]: {
        direction: SORT_DIRECTION.ascending,
        priority: 0,
      },
    });

    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [explicitItemId]: { [titlePropertyId]: 'z' },
        [sparseItemId]: {},
      },
      properties: {
        [titlePropertyId]: {
          default: 'a',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(() => stateSubject.asObservable(), vi.fn());
    const documentId = new Repo({}).create({}).documentId;

    await expect(
      service.filteredIdList.fetch({
        documentId,
        options: {},
        path: '/db',
      }),
    ).resolves.toEqual([sparseItemId, explicitItemId]);
  });

  it('drops inline stored overrides that match the property default', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: { [titlePropertyId]: 'custom' },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postValue('/db', documentId, itemId, titlePropertyId, 'untitled');

    expect(stateSubject.value?.data[itemId]).toEqual({});
    await expect(
      service.databaseEffectiveValue.fetch({
        documentId,
        itemId,
        path: '/db',
        propertyId: titlePropertyId,
      }),
    ).resolves.toBe('untitled');
  });

  it('drops inline stored overrides after trim normalization', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: { [titlePropertyId]: 'custom' },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postValue('/db', documentId, itemId, titlePropertyId, ' untitled ');

    expect(stateSubject.value?.data[itemId]).toEqual({});
    await expect(
      service.databaseEffectiveValue.fetch({
        documentId,
        itemId,
        path: '/db',
        propertyId: titlePropertyId,
      }),
    ).resolves.toBe('untitled');
  });

  it('drops dialog payload overrides that match the property default', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: { [titlePropertyId]: 'custom' },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postItem(
      '/db',
      documentId,
      {
        [titlePropertyId]: 'untitled',
      },
      itemId,
    );

    expect(stateSubject.value?.data[itemId]).toEqual({});
    await expect(
      service.databaseEffectiveValue.fetch({
        documentId,
        itemId,
        path: '/db',
        propertyId: titlePropertyId,
      }),
    ).resolves.toBe('untitled');
  });

  it('drops dialog payload overrides after trim normalization', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: { [titlePropertyId]: 'custom' },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postItem(
      '/db',
      documentId,
      {
        [titlePropertyId]: ' untitled ',
      },
      itemId,
    );

    expect(stateSubject.value?.data[itemId]).toEqual({});
    await expect(
      service.databaseEffectiveValue.fetch({
        documentId,
        itemId,
        path: '/db',
        propertyId: titlePropertyId,
      }),
    ).resolves.toBe('untitled');
  });

  it('removes stale stored keys when an edited value returns to the property default', async () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: {
          [titlePropertyId]: 'custom',
          [donePropertyId]: true,
        },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
        [donePropertyId]: {
          default: false,
          name: 'Done',
          type: 'boolean',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postItem(
      '/db',
      documentId,
      {
        [titlePropertyId]: 'untitled',
      },
      itemId,
    );

    expect(stateSubject.value?.data[itemId]).toEqual({});
  });

  it('keeps only normalized stored overrides after syncing an edited item', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: {
          [titlePropertyId]: 'custom',
        },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postItem(
      '/db',
      documentId,
      {
        [titlePropertyId]: ' next title ',
      },
      itemId,
    );

    expect(stateSubject.value?.data[itemId]).toEqual({
      [titlePropertyId]: 'next title',
    });
  });

  it('keeps an empty persisted item after sync instead of removing it', async () => {
    const titlePropertyId = generatePropertyId();
    const itemId = generateItemId();
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {
        [itemId]: {
          [titlePropertyId]: 'custom',
        },
      },
      properties: {
        [titlePropertyId]: {
          default: 'untitled',
          name: 'Title',
          type: 'string',
        },
      },
      views: {},
    });

    const changeDatabaseState = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          data: {
            ...state.data,
          },
        });

        return Promise.resolve();
      },
    );

    const { setupDatabaseDataService } = await import('./databaseDataService');

    const service = setupDatabaseDataService(
      () => stateSubject.asObservable(),
      changeDatabaseState,
    );
    const documentId = new Repo({}).create({}).documentId;

    await service.postItem('/db', documentId, {}, itemId);

    expect(stateSubject.value?.data[itemId]).toEqual({});
    expect(Object.hasOwn(stateSubject.value?.data ?? {}, itemId)).toBe(true);
  });
});
