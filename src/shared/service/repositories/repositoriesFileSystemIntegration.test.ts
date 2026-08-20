import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  captureRecoveryKeyFromUnavailableRoot,
  createDirectoryHandleMock,
} from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

/**
 * Real cross-service proof that `src/shared/service/fileSystem` and
 * `src/shared/service/repositories` are actually wired together end to end for same-entry
 * reconnect write-recovery settlement. Neither service is mocked here — only the persisted
 * device-directory record store (browser storage boundary) and the Automerge `Repo` class
 * itself, whose `flush()` is made to reject to prove the settlement contract.
 */

type MockRepoInstance = {
  flush: ReturnType<typeof vi.fn<() => Promise<void>>>;
};

const repoInstances = vi.hoisted((): MockRepoInstance[] => []);
const getRecordListMock = vi.hoisted(() => vi.fn());
const updateRecordListMock = vi.hoisted(() => vi.fn());

vi.mock('../fileSystem/setupFileSystemDirectoryHandleService', () => ({
  useFileSystemDirectoryHandleService: () => ({
    getRecordList: getRecordListMock,
    updateRecordList: updateRecordListMock,
  }),
}));

vi.mock('@automerge/automerge-repo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@automerge/automerge-repo')>();

  class MockRepo {
    readonly create = vi.fn();
    readonly delete = vi.fn();
    readonly flush = vi.fn().mockResolvedValue(undefined);

    constructor() {
      repoInstances.push(this);
    }
  }

  return { ...actual, Repo: MockRepo };
});

describe('fileSystem/repositories same-entry integration', () => {
  beforeEach(() => {
    vi.resetModules();
    repoInstances.length = 0;
    getRecordListMock.mockReset();
    updateRecordListMock.mockReset();
    updateRecordListMock.mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: { getDirectory: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns reconnectedWithWriteRecoveryFailure when repo.flush() rejects after a proven same-entry remount', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const { useFileSystemService } = await import('../fileSystem/useFileSystemService');
    const { useRepositoriesService } = await import('./repositoriesService');
    const fileSystemService = useFileSystemService();
    const repositoriesService = useRepositoriesService();

    await vi.waitFor(async () => {
      await expect(fileSystemService.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    await repositoriesService.initializeRepository('/Device Files/Work');
    const [repo] = repoInstances;

    expect(repo).toBeDefined();
    repo?.flush.mockRejectedValueOnce(new Error('disk full'));

    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service: fileSystemService,
      spaceName: 'Work',
    });

    await expect(
      fileSystemService.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnectedWithWriteRecoveryFailure', name: 'Work' });

    // The reconnect stays committed: the replacement handle was already persisted/remounted.
    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Work', handle: reconnectedHandle },
    ]);
  });

  it('returns reconnected (fully flushed) when repo.flush() resolves after a proven same-entry remount', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const { useFileSystemService } = await import('../fileSystem/useFileSystemService');
    const { useRepositoriesService } = await import('./repositoriesService');
    const fileSystemService = useFileSystemService();
    const repositoriesService = useRepositoriesService();

    await vi.waitFor(async () => {
      await expect(fileSystemService.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    await repositoriesService.initializeRepository('/Device Files/Work');

    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service: fileSystemService,
      spaceName: 'Work',
    });

    await expect(
      fileSystemService.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });
  });
});
