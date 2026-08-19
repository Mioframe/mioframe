import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { next as A } from '@automerge/automerge';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

/**
 * Real, non-mutually-mocked proof for the fileSystem/repositories same-entry reconnect and
 * write-recovery wiring described in `docs/local-directory-access-recovery.md`.
 *
 * Both `useFileSystemService()` and `useRepositoriesService()` are exercised for real, using
 * their actual same-runtime registration (repositories registers its real write-recovery handler
 * with the real fileSystem service). Only genuine external boundaries are mocked: the
 * IndexedDB-backed persisted directory-handle record store, OPFS root lookup, and the browser
 * `FileSystemDirectoryHandle` itself (unavailable outside a real browser).
 */

const getRecordListMock = vi.fn();
const updateRecordListMock = vi.fn();
const getDirectoryMock = vi.fn();

vi.mock('./fileSystem/setupFileSystemDirectoryHandleService', () => ({
  useFileSystemDirectoryHandleService: () => ({
    getRecordList: getRecordListMock,
    updateRecordList: updateRecordListMock,
  }),
}));

describe('fileSystem/repositories same-entry reconnect integration', () => {
  beforeEach(() => {
    vi.resetModules();
    getRecordListMock.mockReset();
    updateRecordListMock.mockReset();
    getDirectoryMock.mockReset();
    getRecordListMock.mockResolvedValue([]);
    updateRecordListMock.mockResolvedValue(undefined);
    getDirectoryMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'storage', {
      value: { getDirectory: getDirectoryMock },
      configurable: true,
    });
  });

  const createServices = async () => {
    const { useFileSystemService } = await import('./fileSystem');
    const { useRepositoriesService } = await import('./repositories');

    return {
      fileSystemService: useFileSystemService(),
      repositoriesService: useRepositoriesService(),
    };
  };

  it('settles a real cached repository with a genuinely queued write after real same-entry provider remount', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const { fileSystemService, repositoriesService } = await createServices();

    await vi.waitFor(async () => {
      await expect(fileSystemService.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const path = '/Device Files/Work';
    const repo = await firstValueFrom(repositoriesService.getRepo$(path, true));
    const handle = repo.create<{ hello: string; updated?: boolean }>({ hello: 'world' });
    const documentId = handle.documentId;

    // Deterministic barrier: wait for the initial marker/document save to settle through the real
    // storage subsystem before breaking access, instead of an arbitrary fixed sleep.
    await repo.flush();

    // Break write access on the mounted root, mirroring a lost browser permission grant.
    workHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );

    const changedDoc = A.change(handle.doc(), (doc) => {
      doc.updated = true;
    });

    // Call the real storage subsystem directly (not through Automerge's automatic
    // heads-changed listener) so this test owns and awaits the resulting rejection itself.
    await expect(repo.storageSubsystem?.saveDoc(documentId, changedDoc)).rejects.toThrow();

    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });

    // Real remount + the real repositories write-recovery handler settles the queued save.
    await expect(
      fileSystemService.reconnectDeviceDirectory({ handle: reconnectedHandle, spaceName: 'Work' }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });

    // Direct observable storage effect: the queued write actually landed through the rebound
    // handle, not the old (now-broken) one.
    const persistedDoc = await repo.storageSubsystem?.loadDoc<{
      hello: string;
      updated?: boolean;
    }>(documentId);

    expect(persistedDoc?.updated).toBe(true);
    expect(reconnectedHandle.getFileHandleMock.mock.calls.length).toBeGreaterThan(0);
  });

  it('reports reconnectedWithWriteRecoveryFailure when the rebound same-entry mount still cannot flush a real queued write', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const { fileSystemService, repositoriesService } = await createServices();

    await vi.waitFor(async () => {
      await expect(fileSystemService.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const path = '/Device Files/Work';
    const repo = await firstValueFrom(repositoriesService.getRepo$(path, true));
    const handle = repo.create<{ hello: string; updated?: boolean }>({ hello: 'world' });
    const documentId = handle.documentId;

    await repo.flush();

    workHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );

    const changedDoc = A.change(handle.doc(), (doc) => {
      doc.updated = true;
    });

    await expect(repo.storageSubsystem?.saveDoc(documentId, changedDoc)).rejects.toThrow();

    // The same-entry replacement handle also cannot write; the queued save stays blocked.
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      readPermissionState: 'granted',
      sameEntryKey: 'work',
    });
    reconnectedHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );

    await expect(
      fileSystemService.reconnectDeviceDirectory({ handle: reconnectedHandle, spaceName: 'Work' }),
    ).resolves.toEqual({ status: 'reconnectedWithWriteRecoveryFailure', name: 'Work' });
  });
});
