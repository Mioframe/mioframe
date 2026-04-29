import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT, generateViewId } from '@shared/lib/databaseDocument';
import { setupDatabaseViewsService } from './databaseViewsService';

const createDocumentId = () => new Repo({}).create({}).documentId;

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

    const changeDatabase = vi.fn(
      (_path: string, _documentId: string, callback: (state: DatabaseState) => unknown) => {
        const state = stateSubject.value;

        if (!state) {
          throw new Error('state is undefined');
        }

        callback(state);
        stateSubject.next({
          ...state,
          views: {
            ...state.views,
          },
        });

        return Promise.resolve();
      },
    );

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
});
