import type { CFRDocumentContent } from '@shared/lib/cfrDocument';
import type { DatabaseState } from '@shared/lib/databaseDocument';
import { Repo } from '@automerge/automerge-repo';
import { BehaviorSubject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let documentStateSubject: BehaviorSubject<CFRDocumentContent | Error | undefined>;

vi.mock('../document', () => ({
  useDocumentService: () => ({
    cfrDocumentState$: () => documentStateSubject.asObservable(),
    change: vi.fn(),
  }),
}));

const createDatabaseState = (): DatabaseState => ({
  data: {},
  properties: {},
  version: 3,
  views: {},
});

const createDatabaseDocument = (body: DatabaseState): CFRDocumentContent => ({
  body,
  name: 'Database',
  type: 'database',
  version: 1,
});

describe('useDatabaseDocumentService', () => {
  beforeEach(() => {
    vi.resetModules();
    documentStateSubject = new BehaviorSubject<CFRDocumentContent | Error | undefined>(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps databaseState subscription alive across error-as-value emissions', async () => {
    const { useDatabaseDocumentService } = await import('./databaseService');
    const service = useDatabaseDocumentService();
    const documentId = new Repo({}).create({}).documentId;
    const next = vi.fn();
    const error = vi.fn();
    const complete = vi.fn();

    const unsubscribe = await service.databaseState.subscribe({
      query: {
        documentId,
        path: '/db',
      },
      next,
      error,
      complete,
    });

    const sourceError = new Error('directory failed');
    documentStateSubject.next(sourceError);

    await vi.waitFor(() => {
      expect(next).toHaveBeenCalledWith(sourceError);
    });
    expect(error).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();

    const state = createDatabaseState();
    documentStateSubject.next(createDatabaseDocument(state));

    await vi.waitFor(() => {
      const lastEmission = next.mock.lastCall?.[0];

      expect(lastEmission).toEqual(
        expect.objectContaining({
          data: state.data,
          properties: state.properties,
          version: state.version,
        }),
      );
      expect(lastEmission).not.toBeInstanceOf(Error);
      expect(lastEmission?.views).toBeDefined();
    });
    expect(error).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();

    unsubscribe();
  });
});
