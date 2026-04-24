import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import { useDatabasePropertiesService } from './databasePropertiesService';

describe('useDatabasePropertiesService', () => {
  it('removes undefined fields before posting a new property', async () => {
    const stateSubject = new BehaviorSubject<DatabaseState | undefined>({
      version: 3,
      data: {},
      properties: {},
      views: {},
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
          properties: {
            ...state.properties,
          },
        });

        return Promise.resolve();
      },
    );

    const service = useDatabasePropertiesService(() => stateSubject.asObservable(), changeDatabase);
    const documentId = new Repo({}).create({}).documentId;

    const propertyId = await service.post('/db', documentId, {
      default: undefined,
      name: 'Title',
      type: 'string',
    });

    expect(stateSubject.value?.properties[propertyId]).toEqual({
      name: 'Title',
      type: 'string',
    });
  });
});
