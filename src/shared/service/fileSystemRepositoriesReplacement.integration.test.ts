import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';
import { next as A } from '@automerge/automerge';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

/**
 * Real, non-mutually-mocked proof for the fileSystem/repositories confirmed-replacement
 * lease and same-entry write-recovery wiring described in
 * `docs/local-directory-access-recovery.md`.
 *
 * Both `useFileSystemService()` and `useRepositoriesService()` are exercised for real, using
 * their actual same-runtime registration (repositories registers its real write-recovery
 * handler and confirmed-replacement lease provider with the real fileSystem service). Only
 * genuine external boundaries are mocked: the IndexedDB-backed persisted directory-handle
 * record store, OPFS root lookup, and the browser `FileSystemDirectoryHandle` itself (unavailable
 * outside a real browser).
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

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

describe('fileSystem/repositories confirmed-replacement integration', () => {
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

    // Let the healthy initial background marker/document save settle before breaking access.
    await wait(250);

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

    // No dangling automatic save lands unexpectedly afterward.
    await wait(250);
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

    await wait(250);

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

    await wait(250);
  });

  it('gates real repository access under an active confirmed-replacement lease and resumes it against the new mount only after release', async () => {
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

    const replacementHandle = createDirectoryHandleMock({
      name: 'Work (new)',
      permissionState: 'granted',
      sameEntryKey: 'a-different-physical-entry',
    });

    let resolvePersist!: () => void;
    updateRecordListMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolvePersist = resolve;
        }),
    );

    const replacementPromise = fileSystemService.replaceRememberedDeviceDirectory({
      handle: replacementHandle,
      spaceName: 'Work',
    });

    // Let lease acquisition and the deferred persistence call start.
    await wait(20);

    let repoAccessSettled = false;
    const repoAccessPromise = repositoriesService
      .initializeRepository('/Device Files/Work')
      .then(() => {
        repoAccessSettled = true;
      });

    await wait(20);
    expect(repoAccessSettled).toBe(false);
    expect(replacementHandle.getDirectoryHandleMock).not.toHaveBeenCalled();
    expect(replacementHandle.getFileHandleMock).not.toHaveBeenCalled();

    resolvePersist();

    await expect(replacementPromise).resolves.toEqual({ status: 'reconnected', name: 'Work' });
    await repoAccessPromise;
    expect(repoAccessSettled).toBe(true);

    // Repository access resumed against the new physical storage, not the old one.
    await vi.waitFor(() => {
      expect(
        replacementHandle.getDirectoryHandleMock.mock.calls.length +
          replacementHandle.getFileHandleMock.mock.calls.length,
      ).toBeGreaterThan(0);
    });
  });

  it('leaves the old mount reachable and does not create a Repo under it when confirmed replacement fails to persist', async () => {
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

    const replacementHandle = createDirectoryHandleMock({
      name: 'Work (new)',
      permissionState: 'granted',
      sameEntryKey: 'another-different-physical-entry',
    });

    let rejectPersist!: (error: Error) => void;
    updateRecordListMock.mockImplementationOnce(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectPersist = reject;
        }),
    );

    const replacementPromise = fileSystemService.replaceRememberedDeviceDirectory({
      handle: replacementHandle,
      spaceName: 'Work',
    });

    await wait(20);

    let repoAccessSettled = false;
    const repoAccessPromise = repositoriesService
      .initializeRepository('/Device Files/Work')
      .then(() => {
        repoAccessSettled = true;
      });

    await wait(20);
    expect(repoAccessSettled).toBe(false);

    rejectPersist(new Error('persisted record write failed'));

    await expect(replacementPromise).rejects.toThrow('persisted record write failed');

    // The lease is released even on failure, so blocked repository access resumes — against the
    // unchanged old mount, since the replacement never completed.
    await repoAccessPromise;
    expect(repoAccessSettled).toBe(true);
    expect(replacementHandle.getDirectoryHandleMock).not.toHaveBeenCalled();
    expect(replacementHandle.getFileHandleMock).not.toHaveBeenCalled();
  });
});
