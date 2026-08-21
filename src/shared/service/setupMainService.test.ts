import { describe, expect, it, vi } from 'vitest';
import { Observable } from 'rxjs';

vi.mock('../serviceClient/fileSystem/useFileSystemAccessPermissionBroker', () => {
  throw new Error('setupMainService must not import the main-thread permission broker');
});

// Assembly is exercised against stand-in services so this stays a boundary test on
// `setupMainService`'s omission wiring, independent of the real services' browser-only
// (e.g. IndexedDB) runtime dependencies, which are covered by their own unit tests.
vi.mock('./document', () => ({ useDocumentService: () => ({}) }));
vi.mock('./databaseDocument', () => ({ useDatabaseDocumentService: () => ({}) }));
vi.mock('./google', () => ({ useGoogleService: () => ({}) }));
vi.mock('./fileSystem', () => ({
  useFileSystemService: () => ({
    directoryState$: new Observable(),
    readDirectoryFresh: vi.fn(),
  }),
}));
vi.mock('./repositories', () => ({
  useRepositoriesService: () => ({
    repositoryState$: new Observable(),
    documentIds$: new Observable(),
    repositoryState: {},
  }),
}));

describe('setupMainService', () => {
  it('initializes without importing the main-thread permission broker', async () => {
    await expect(import('./setupMainService')).resolves.toMatchObject({
      serviceId: 'mainBackgroundService',
      setupMainService: expect.any(Function),
    });
  });

  it('excludes worker-internal reactive APIs from the published service surface', async () => {
    const { setupMainService } = await import('./setupMainService');
    const service = setupMainService();

    expect(service.fileSystem).not.toHaveProperty('directoryState$');
    expect(service.repositories).not.toHaveProperty('repositoryState$');
    expect(service.repositories).not.toHaveProperty('documentIds$');

    expect(service.fileSystem.readDirectoryFresh).toEqual(expect.any(Function));
    expect(service.repositories.repositoryState).toBeDefined();

    // @ts-expect-error -- `directoryState$` must not be part of the published `fileSystem` type.
    expect(service.fileSystem.directoryState$).toBeUndefined();
    // @ts-expect-error -- `repositoryState$` must not be part of the published `repositories` type.
    expect(service.repositories.repositoryState$).toBeUndefined();
    // @ts-expect-error -- `documentIds$` must not be part of the published `repositories` type.
    expect(service.repositories.documentIds$).toBeUndefined();
  });
});
