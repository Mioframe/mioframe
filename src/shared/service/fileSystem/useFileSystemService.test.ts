import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import {
  encodeStorageKeyToV2FileName,
  partialKeyToFileName,
  storageAdapterMarkerFileName,
} from '@shared/lib/automergeAdapter';
import { WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE } from '@shared/lib/webFileSystemProvider';
import {
  captureRecoveryKeyFromUnavailableRoot,
  createDirectoryHandleMock,
  createFileHandleMock,
} from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import type { FSNodeStat, IFileSystemProvider, VfsEvent } from '@shared/lib/virtualFileSystem';
import { FSNodeType, VfsEventSource } from '@shared/lib/virtualFileSystem';
import { OPFSName } from '../directories';
import { FileSystemServiceErrorCode } from './fileSystemContracts';

const getRecordListMock = vi.fn();
const updateRecordListMock = vi.fn();
const getDirectoryMock = vi.fn();
const inspectMioframeSpaceDirectoryMock = vi.hoisted(() => vi.fn());

vi.mock('@shared/lib/automergeAdapter', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/automergeAdapter')>();
  return {
    ...actual,
    inspectMioframeSpaceDirectory: inspectMioframeSpaceDirectoryMock,
  };
});

vi.mock('./setupFileSystemDirectoryHandleService', () => ({
  useFileSystemDirectoryHandleService: () => ({
    getRecordList: getRecordListMock,
    updateRecordList: updateRecordListMock,
  }),
}));

const directoryStat = {
  type: FSNodeType.Directory,
  capabilities: {
    canDelete: true,
    canChangePath: true,
    canEditChildren: true,
  },
} satisfies FSNodeStat;

const fileStat = {
  type: FSNodeType.File,
  size: 7,
  capabilities: {
    canDelete: true,
    canChangePath: true,
  },
} satisfies FSNodeStat;

const createDocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = partialKeyToFileName([documentId, 'snapshot', 'hash']);

  if (!fileName) {
    throw new Error('Failed to create Automerge storage file fixture');
  }

  return fileName;
};

const createV2DocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = encodeStorageKeyToV2FileName(documentId, 'snapshot', 'a'.repeat(64));

  if (!fileName) {
    throw new Error('Failed to create v2 Automerge storage file fixture');
  }

  return fileName;
};

const createDiagnosticProvider = ({
  createDirectory = vi.fn(() => Promise.resolve(undefined)),
  readDirectory,
}: {
  createDirectory?: ReturnType<typeof vi.fn<(path: string) => Promise<void>>>;
  readDirectory: ReturnType<typeof vi.fn<(path: string) => Promise<[string, FSNodeStat][]>>>;
}) => {
  const listeners = new Set<(event: VfsEvent) => void>();

  const provider = {
    stat: vi.fn(() => Promise.resolve(directoryStat)),
    readFile: vi.fn(() => Promise.resolve(new File([], 'unused'))),
    writeFile: vi.fn(() =>
      Promise.resolve({
        stat: {
          type: FSNodeType.File,
          size: 0,
        },
      }),
    ),
    readDirectory,
    createDirectory,
    delete: vi.fn(() => Promise.resolve(undefined)),
    move: vi.fn(() => Promise.resolve(undefined)),
    watch: (callback: (event: VfsEvent) => void) => {
      listeners.add(callback);

      return () => {
        listeners.delete(callback);
      };
    },
  } satisfies IFileSystemProvider;

  return {
    provider,
    emit: (event: Omit<VfsEvent, 'source'>) => {
      listeners.forEach((listener) => {
        listener({
          source: VfsEventSource.PROVIDER,
          ...event,
        });
      });
    },
  };
};

const isAccessErrorWithRecoveryKey = (
  error: unknown,
): error is Error & {
  mode: 'read' | 'readwrite';
  spaceName: string;
  toJSON: () => Record<string, unknown>;
} =>
  error instanceof Error &&
  'spaceName' in error &&
  typeof error.spaceName === 'string' &&
  'mode' in error &&
  (error.mode === 'read' || error.mode === 'readwrite') &&
  'toJSON' in error &&
  typeof error.toJSON === 'function';

const isDomainErrorLike = (error: unknown): error is Error & { cause?: unknown; code?: string } =>
  // oxlint-disable-next-line no-underscore-dangle -- `__isDomainError` is DomainError's own public duck-typing marker field name.
  error instanceof Error && '__isDomainError' in error && error.__isDomainError === true;

describe('useFileSystemService', () => {
  beforeEach(() => {
    vi.resetModules();
    getRecordListMock.mockReset();
    updateRecordListMock.mockReset();
    getDirectoryMock.mockReset();
    getRecordListMock.mockResolvedValue([]);
    updateRecordListMock.mockResolvedValue(undefined);
    getDirectoryMock.mockResolvedValue(undefined);
    inspectMioframeSpaceDirectoryMock.mockReset();
    // Most reconnect/relocate tests exercise the same-entry and identity-checking behavior, not
    // the marker check itself; default the candidate to a valid Mioframe space so those tests
    // reach `confirmationRequired`/`relocated` unchanged. Marker-specific tests override this.
    inspectMioframeSpaceDirectoryMock.mockResolvedValue({ looksLikeExistingSpace: true });
    Object.defineProperty(navigator, 'storage', {
      value: {
        getDirectory: getDirectoryMock,
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createService = async () => {
    const { useFileSystemService } = await import('./useFileSystemService');

    return useFileSystemService();
  };

  it('hydrates remembered device directories even when permission is not currently granted', async () => {
    const grantedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const deniedHandle = createDirectoryHandleMock({
      name: 'Private',
      permissionState: 'denied',
      sameEntryKey: 'private',
    });
    const opfsHandle = createDirectoryHandleMock({
      name: OPFSName,
      permissionState: 'granted',
      sameEntryKey: 'opfs',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: grantedHandle },
      { name: 'Private', handle: deniedHandle },
    ]);
    getDirectoryMock.mockResolvedValue(opfsHandle);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: false,
          name: OPFSName,
        },
        {
          canDisconnect: true,
          name: 'Work',
        },
        {
          canDisconnect: true,
          name: 'Private',
        },
      ]);
    });
    expect(grantedHandle.requestPermissionMock).not.toHaveBeenCalled();
    expect(deniedHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('hydrates normalized persisted records without rewriting them', async () => {
    const legacyHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      {
        name: 'Archive',
        handle: legacyHandle,
      },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Archive',
        },
      ]);
    });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('adds unique device directory names and reuses existing handles without returning handles', async () => {
    const firstHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    const duplicateHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'second-work',
    });

    getRecordListMock
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ name: 'Work', handle: firstHandle }])
      .mockResolvedValueOnce([{ name: 'Work', handle: duplicateHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(firstHandle)).resolves.toEqual({
      name: 'Work',
    });
    await expect(service.addDeviceDirectory(duplicateHandle)).resolves.toEqual({
      name: 'Work',
    });
    await expect(service.addDeviceDirectory(secondHandle)).resolves.toEqual({
      name: 'Work (2)',
    });

    expect(updateRecordListMock).toHaveBeenNthCalledWith(1, [
      { name: 'Work', handle: firstHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(2, [
      { name: 'Work', handle: duplicateHandle },
    ]);
    expect(updateRecordListMock).toHaveBeenNthCalledWith(3, [
      { name: 'Work', handle: duplicateHandle },
      { name: 'Work (2)', handle: secondHandle },
    ]);
  });

  it('reserves the Browser Storage name for the built-in browser entry', async () => {
    const conflictingHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'conflicting-browser-storage',
    });
    getDirectoryMock.mockResolvedValue(createDirectoryHandleMock({ name: OPFSName }));
    let persistedRecords: Array<{
      name: string;
      handle: FileSystemDirectoryHandle;
    }> = [];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();

    await vi.waitFor(() => {
      expect(getDirectoryMock).toHaveBeenCalled();
    });

    await expect(service.addDeviceDirectory(conflictingHandle)).resolves.toEqual({
      name: `${OPFSName} (2)`,
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual(
      expect.arrayContaining([
        {
          canDisconnect: false,
          name: OPFSName,
        },
        {
          canDisconnect: true,
          name: `${OPFSName} (2)`,
        },
      ]),
    );
  });

  it('appends a new distinct handle without replacing unrelated persisted records', async () => {
    const existingHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'archive',
    });
    const addedHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Archive', handle: existingHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(addedHandle)).resolves.toEqual({
      name: 'Work',
    });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Archive', handle: existingHandle },
      { name: 'Work', handle: addedHandle },
    ]);
  });

  it('persists duplicate-name and reserved-name migrations without display copy', async () => {
    const opfsHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'opfs',
    });
    const firstHandle = createDirectoryHandleMock({
      name: OPFSName,
      sameEntryKey: 'first-browser-storage',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'archive',
    });
    getDirectoryMock.mockResolvedValue(opfsHandle);
    getRecordListMock.mockResolvedValue([
      { name: OPFSName, handle: firstHandle },
      { name: 'Archive', handle: secondHandle },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: false,
          name: OPFSName,
        },
        {
          canDisconnect: true,
          name: `${OPFSName} (2)`,
        },
        {
          canDisconnect: true,
          name: 'Archive',
        },
      ]);
    });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      {
        name: `${OPFSName} (2)`,
        handle: firstHandle,
      },
      {
        name: 'Archive',
        handle: secondHandle,
      },
    ]);
  });

  it('renames an existing mounted handle and removes the previous mounted name', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      name: 'Archive',
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        canDisconnect: true,
        name: 'Archive',
      },
    ]);
    expect(updateRecordListMock).toHaveBeenCalledWith([{ name: 'Archive', handle: renamedHandle }]);
  });

  it('addDeviceDirectory invalidates the recovery key for the mounted name it renames away from', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();
    const staleKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: oldHandle,
      service,
      spaceName: 'Projects',
    });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      name: 'Archive',
    });

    // A later persisted-store read reports a "Projects" record again for a different physical
    // directory without this service instance ever remounting a provider for it. The stale key
    // captured for the renamed-away "Projects" provider must not validate against it.
    const reoccupyingHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'other',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Archive', handle: renamedHandle },
      { name: 'Projects', handle: reoccupyingHandle },
    ]);
    updateRecordListMock.mockClear();

    await expect(
      service.reconnectDeviceDirectory({
        handle: reoccupyingHandle,
        spaceName: 'Projects',
        recoveryKey: staleKey,
      }),
    ).resolves.toEqual({ status: 'staleRecovery' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('replaces only the matching persisted record when a remembered handle is renamed', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'shared-handle',
    });
    const untouchedHandle = createDirectoryHandleMock({
      name: 'Reference',
      sameEntryKey: 'reference',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Projects', handle: workHandle },
      { name: 'Reference', handle: untouchedHandle },
    ]);

    const service = await createService();

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      name: 'Archive',
    });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Archive', handle: renamedHandle },
      { name: 'Reference', handle: untouchedHandle },
    ]);
  });

  it('successful addDeviceDirectory() rename/replacement clears the pending access request owned by the removed provider', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Projects' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Projects' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    await expect(service.addDeviceDirectory(renamedHandle)).resolves.toEqual({
      name: 'Archive',
    });

    // The stale request can no longer be fetched, prepared, or resolved through the old identity.
    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toBeUndefined();
    await expect(
      service.getTemporaryFileSystemAccessHandle({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toBeUndefined();
    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        spaceName: 'Projects',
        permissionState: 'granted',
        recoveryKey: 'irrelevant-key',
      }),
    ).resolves.toEqual({ status: 'missing' });
  });

  it('failed persistence during addDeviceDirectory() preserves the current provider pending request and recovery identity', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    const renamedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: oldHandle,
      service,
      spaceName: 'Projects',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Projects' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Projects' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });

    updateRecordListMock.mockRejectedValueOnce(new Error('storage write failed'));

    await expect(service.addDeviceDirectory(renamedHandle)).rejects.toThrow('storage write failed');

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Projects' },
    ]);

    // The recoveryKey captured before the failed persistence remains current for the same target:
    // a different candidate against it still reaches the ordinary confirmation path instead of
    // `staleRecovery`, proving currency through public reconnect behavior rather than internals.
    const otherHandle = createDirectoryHandleMock({ name: 'Other', sameEntryKey: 'other' });

    await expect(
      service.reconnectDeviceDirectory({ handle: otherHandle, spaceName: 'Projects', recoveryKey }),
    ).resolves.toEqual({ status: 'confirmationRequired' });
  });

  it('addDeviceDirectory() treats a same-name different-handle representing the same physical entry as provider replacement', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    // Same mounted name as `oldHandle`, but a distinct handle object. This exercises the
    // `existingRecord.handle !== nextRecord.handle` half of `isProviderReplacement` in isolation
    // from any name change.
    const replacementHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();
    const staleKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: oldHandle,
      service,
      spaceName: 'Projects',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Projects' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Projects' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    await expect(service.addDeviceDirectory(replacementHandle)).resolves.toEqual({
      name: 'Projects',
    });

    // The old pending request can no longer be fetched through the same mounted name.
    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toBeUndefined();

    // The old recoveryKey no longer identifies the (now replaced) mounted provider.
    const probeHandle = createDirectoryHandleMock({ name: 'Probe' });
    updateRecordListMock.mockClear();

    await expect(
      service.reconnectDeviceDirectory({
        handle: probeHandle,
        spaceName: 'Projects',
        recoveryKey: staleKey,
      }),
    ).resolves.toEqual({ status: 'staleRecovery' });
    expect(updateRecordListMock).not.toHaveBeenCalled();

    // The replacement remains mounted under the same name.
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Projects' },
    ]);
  });

  it('addDeviceDirectory() treats re-adding the exact same handle reference as a true non-replacement, preserving the pending request and recovery identity', async () => {
    const sharedHandle = createDirectoryHandleMock({
      name: 'Projects',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Projects', handle: sharedHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: sharedHandle,
      service,
      spaceName: 'Projects',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Projects' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Projects' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: sharedHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: sharedHandle }]);

    await expect(service.addDeviceDirectory(sharedHandle)).resolves.toEqual({
      name: 'Projects',
    });

    // The still-valid pending request survives the true non-replacement.
    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Projects' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Projects' });

    // The existing recovery identity remains current: a different candidate against the still-live
    // key reaches the ordinary confirmation path instead of `staleRecovery`.
    const otherHandle = createDirectoryHandleMock({ name: 'Other', sameEntryKey: 'other' });

    await expect(
      service.reconnectDeviceDirectory({ handle: otherHandle, spaceName: 'Projects', recoveryKey }),
    ).resolves.toEqual({ status: 'confirmationRequired' });
  });

  it('keeps the previous mounted name when re-adding the same handle name', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });
    const sameHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();

    await expect(service.addDeviceDirectory(sameHandle)).resolves.toEqual({
      name: 'Projects',
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        canDisconnect: true,
        name: 'Projects',
      },
    ]);
  });

  it('does not emit provider delete or create events when re-adding the same remembered name', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });
    const sameHandle = createDirectoryHandleMock({
      name: 'Projects',
      sameEntryKey: 'shared-handle',
    });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Projects', handle: oldHandle }]);

    const service = await createService();
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Projects', (event) => {
      events.push({
        source: event.source,
        type: event.type,
      });
    });

    await service.addDeviceDirectory(sameHandle);
    unsubscribe();

    expect(events).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'provider',
          type: 'delete',
        }),
        expect.objectContaining({
          source: 'provider',
          type: 'create',
        }),
      ]),
    );
  });

  it('removes matching device directory names from persistence and active state', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();

    await service.removeDeviceDirectory('Work');

    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
    expect(updateRecordListMock).toHaveBeenCalledTimes(1);
    expect(updateRecordListMock).toHaveBeenCalledWith([]);
  });

  it('removes only the matching device directory when other remembered spaces remain', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();

    await service.removeDeviceDirectory('Work');

    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        canDisconnect: true,
        name: 'Archive',
      },
    ]);
    expect(updateRecordListMock).toHaveBeenCalledWith([{ name: 'Archive', handle: archiveHandle }]);
  });

  it('does not touch persisted records when removing OPFS or an unknown name', async () => {
    const service = await createService();

    await service.removeDeviceDirectory(OPFSName);
    await service.removeDeviceDirectory('Missing');

    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('returns early when removing OPFS without loading persisted records', async () => {
    const service = await createService();

    await service.removeDeviceDirectory(OPFSName);

    expect(getRecordListMock).not.toHaveBeenCalled();
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('reconnects the persisted handle under the same mounted name when the selection is confirmed as the same entry', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work (moved)',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });
    unsubscribe();

    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Work', handle: reconnectedHandle },
    ]);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
    expect(events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'provider', type: 'unmount' }),
        expect.objectContaining({ source: 'provider', type: 'mount' }),
      ]),
    );
  });

  it('mints a fresh recoveryKey for the provider that replaces a same-entry reconnect target', async () => {
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

    const service = await createService();
    const firstKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    // A repeated unavailable-root error from the same still-mounted provider reuses the key.
    const repeatedKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    expect(repeatedKey).toBe(firstKey);

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey: firstKey,
      }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });

    const secondKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: reconnectedHandle,
      service,
      spaceName: 'Work',
    });
    expect(secondKey).not.toBe(firstKey);

    // The old key no longer identifies the (now replaced) mounted provider.
    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey: firstKey,
      }),
    ).resolves.toEqual({ status: 'staleRecovery' });
  });

  it('reconnectDeviceDirectory returns staleRecovery with zero mutation for an old key after the provider was replaced', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const staleKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });

    // Replace the mounted provider under the same name (e.g. a different device re-adds "Work").
    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'replacement',
    });
    await service.removeDeviceDirectory('Work');
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: replacementHandle }]);
    await service.addDeviceDirectory(replacementHandle);

    updateRecordListMock.mockClear();
    const candidateHandle = createDirectoryHandleMock({ name: 'Candidate' });

    await expect(
      service.reconnectDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey: staleKey,
      }),
    ).resolves.toEqual({ status: 'staleRecovery' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('relocateRememberedDeviceDirectory returns staleRecovery with zero mutation for an old key after the provider was replaced', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const staleKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });

    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'replacement',
    });
    await service.removeDeviceDirectory('Work');
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: replacementHandle }]);
    await service.addDeviceDirectory(replacementHandle);

    updateRecordListMock.mockClear();
    const candidateHandle = createDirectoryHandleMock({ name: 'Candidate' });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey: staleKey,
      }),
    ).resolves.toEqual({ status: 'staleRecovery' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
    expect(inspectMioframeSpaceDirectoryMock).not.toHaveBeenCalled();
  });

  it('clears a pending access request for the space after a successful reconnect', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: promptHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Work' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Work' });

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
  });

  it('same-entry reconnect remounts and clears stale requests before running write-recovery settlement', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    const reconnectedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: promptHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Work' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Work' });

    const callOrder: string[] = [];
    updateRecordListMock.mockImplementationOnce(() => {
      callOrder.push('persist');
      return Promise.resolve(undefined);
    });
    const handler = vi.fn().mockImplementation(() => {
      callOrder.push('settlement');
      return Promise.resolve({ status: 'flushed' as const });
    });
    service.registerWriteAccessRecoveryHandler(handler);

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnected', name: 'Work' });

    expect(callOrder).toEqual(['persist', 'settlement']);
    expect(handler).toHaveBeenCalledWith({
      mountPath: '/Device Files/Work',
      operation: 'write',
      spaceName: 'Work',
    });
    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
  });

  it('returns reconnectedWithWriteRecoveryFailure and keeps the new provider mounted when settlement does not flush', async () => {
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

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const handler = vi.fn().mockResolvedValue({ status: 'stillBlocked' as const });
    service.registerWriteAccessRecoveryHandler(handler);

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'reconnectedWithWriteRecoveryFailure', name: 'Work' });

    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Work', handle: reconnectedHandle },
    ]);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
  });

  it('does not let a queued removeDeviceDirectory begin its topology mutation while same-entry write-recovery settlement is pending, and releases the queue once settlement flushes', async () => {
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

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    let releaseSettlement: (() => void) | undefined;
    const handler = vi.fn(
      () =>
        new Promise<{ status: 'flushed' }>((resolve) => {
          releaseSettlement = () => {
            resolve({ status: 'flushed' });
          };
        }),
    );
    service.registerWriteAccessRecoveryHandler(handler);

    const reconnectPromise = service.reconnectDeviceDirectory({
      handle: reconnectedHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    // Let reconnect's mutation turn actually reach the pending settlement handler before queuing
    // the remove behind it.
    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    const callsBeforeRemove = getRecordListMock.mock.calls.length;
    const removePromise = service.removeDeviceDirectory('Work');

    // Flush several microtask turns: if the queue released before settlement completed, remove's
    // own topology read would run during these ticks even though settlement is still pending.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getRecordListMock.mock.calls.length).toBe(callsBeforeRemove);

    releaseSettlement?.();

    await expect(reconnectPromise).resolves.toEqual({ status: 'reconnected', name: 'Work' });
    await expect(removePromise).resolves.toBeUndefined();
    expect(getRecordListMock.mock.calls.length).toBeGreaterThan(callsBeforeRemove);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
  });

  it('releases the mutation queue for a queued mutation after non-flushed same-entry settlement, without rolling back the committed reconnect', async () => {
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

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    let releaseSettlement: (() => void) | undefined;
    const handler = vi.fn(
      () =>
        new Promise<{ status: 'stillBlocked' }>((resolve) => {
          releaseSettlement = () => {
            resolve({ status: 'stillBlocked' });
          };
        }),
    );
    service.registerWriteAccessRecoveryHandler(handler);

    const reconnectPromise = service.reconnectDeviceDirectory({
      handle: reconnectedHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    const callsBeforeRemove = getRecordListMock.mock.calls.length;
    const removePromise = service.removeDeviceDirectory('Work');

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getRecordListMock.mock.calls.length).toBe(callsBeforeRemove);

    releaseSettlement?.();

    // Non-flushed settlement still returns the committed warning result; the remount is not
    // rolled back, and the queue releases so the next mutation proceeds.
    await expect(reconnectPromise).resolves.toEqual({
      status: 'reconnectedWithWriteRecoveryFailure',
      name: 'Work',
    });
    await expect(removePromise).resolves.toBeUndefined();
    expect(getRecordListMock.mock.calls.length).toBeGreaterThan(callsBeforeRemove);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
  });

  it('keeps a queued add from reassigning the recovered mounted path until same-entry write-recovery settlement completes', async () => {
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
    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'other-physical-directory',
    });

    // A stateful persisted-store stand-in: the queued remove and add below run back-to-back
    // without an intervening `await`, so a static mocked return value could not reflect the
    // remove's effect on what the add subsequently reads.
    let persistedRecords: Array<{ name: string; handle: FileSystemDirectoryHandle }> = [
      { name: 'Work', handle: workHandle },
    ];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    let releaseSettlement: (() => void) | undefined;
    const handler = vi.fn(
      () =>
        new Promise<{ status: 'flushed' }>((resolve) => {
          releaseSettlement = () => {
            resolve({ status: 'flushed' });
          };
        }),
    );
    service.registerWriteAccessRecoveryHandler(handler);

    const reconnectPromise = service.reconnectDeviceDirectory({
      handle: reconnectedHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalled();
    });

    // Free the mounted "Work" path, then immediately queue an add for a different physical
    // directory behind it: both must wait for settlement before either can run, so the new
    // directory cannot take over "Work" while cached writes to the recovered mount are pending.
    const callsBeforeQueuedOps = getRecordListMock.mock.calls.length;
    const removePromise = service.removeDeviceDirectory('Work');
    const addPromise = service.addDeviceDirectory(replacementHandle);

    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getRecordListMock.mock.calls.length).toBe(callsBeforeQueuedOps);

    releaseSettlement?.();

    await expect(reconnectPromise).resolves.toEqual({ status: 'reconnected', name: 'Work' });
    await expect(removePromise).resolves.toBeUndefined();
    await expect(addPromise).resolves.toEqual({ name: 'Work' });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
  });

  it('requires confirmation and performs no mutation when the selected directory is a different entry', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const otherHandle = createDirectoryHandleMock({
      name: 'Other',
      permissionState: 'granted',
      sameEntryKey: 'other',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });

    await expect(
      service.reconnectDeviceDirectory({ handle: otherHandle, spaceName: 'Work', recoveryKey }),
    ).resolves.toEqual({ status: 'confirmationRequired' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
  });

  it('requires confirmation and performs no mutation when identity cannot be verified', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Candidate',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    workHandle.isSameEntry = vi.fn(() => Promise.reject(new Error('identity check failed')));

    await expect(
      service.reconnectDeviceDirectory({ handle: candidateHandle, spaceName: 'Work', recoveryKey }),
    ).resolves.toEqual({ status: 'confirmationRequired' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('requires confirmation when the remembered handle exposes no isSameEntry check', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Candidate',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    Object.defineProperty(workHandle, 'isSameEntry', {
      configurable: true,
      value: undefined,
    });

    await expect(
      service.reconnectDeviceDirectory({ handle: candidateHandle, spaceName: 'Work', recoveryKey }),
    ).resolves.toEqual({ status: 'confirmationRequired' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('reconnectDeviceDirectory returns invalidCandidate with zero mutation and no diagnostics when the marker is missing', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Candidate',
      permissionState: 'granted',
      sameEntryKey: 'not-work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });

    await expect(
      service.reconnectDeviceDirectory({ handle: candidateHandle, spaceName: 'Work', recoveryKey }),
    ).resolves.toEqual({ status: 'invalidCandidate' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('reconnectDeviceDirectory wraps an unexpected marker-inspection failure in a safe DomainError preserving the raw cause', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Candidate',
      permissionState: 'granted',
      sameEntryKey: 'not-work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    const rawCause = new DOMException('permission denied while reading marker', 'SecurityError');
    inspectMioframeSpaceDirectoryMock.mockRejectedValueOnce(rawCause);

    await expect(
      service.reconnectDeviceDirectory({ handle: candidateHandle, spaceName: 'Work', recoveryKey }),
    ).rejects.toSatisfy((error: unknown) => {
      // `service` was loaded via a dynamic import after `vi.resetModules()`, so the thrown
      // `DomainError` is a distinct module instance from this file's statically-imported
      // `DomainError`; duck-type via the class's own marker field instead of `instanceof`.
      if (!isDomainErrorLike(error)) {
        return false;
      }
      expect(error.code).toBe(FileSystemServiceErrorCode.markerInspectionFailed);
      expect(error.cause).toBe(rawCause);
      expect(error.message).not.toContain('permission denied while reading marker');
      return true;
    });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('relocateRememberedDeviceDirectory mounts the candidate under a new name and removes the old runtime path', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Work (moved)',
      permissionState: 'granted',
      sameEntryKey: 'moved',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribeOld = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'relocated', name: 'Work (moved)' });
    unsubscribeOld();

    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Work (moved)', handle: candidateHandle },
    ]);
    expect(events).toEqual(
      expect.arrayContaining([expect.objectContaining({ source: 'provider', type: 'unmount' })]),
    );
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work (moved)' },
    ]);

    // The selected storage is reachable only under the new path; the old path routes nowhere.
    await expect(
      service.directoryContent.fetch({ path: '/Device Files/Work' }),
    ).resolves.toBeInstanceOf(Error);
    await expect(
      service.directoryContent.fetch({ path: '/Device Files/Work (moved)' }),
    ).resolves.not.toBeInstanceOf(Error);
  });

  it('relocateRememberedDeviceDirectory allocates a new name that always differs from the old mounted name, even with an equal basename', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'a-different-physical-entry',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'relocated', name: 'Work (2)' });
    expect(updateRecordListMock).toHaveBeenCalledWith([
      { name: 'Work (2)', handle: candidateHandle },
    ]);
  });

  it('relocateRememberedDeviceDirectory persists before mutating the runtime mount', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Work (moved)',
      permissionState: 'granted',
      sameEntryKey: 'moved',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const callOrder: string[] = [];
    updateRecordListMock.mockImplementationOnce(() => {
      callOrder.push('persist');
      return Promise.resolve(undefined);
    });
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      callOrder.push(`runtime:${event.type}`);
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'relocated', name: 'Work (moved)' });
    unsubscribe();

    expect(callOrder[0]).toBe('persist');
    expect(callOrder.slice(1)).toEqual(expect.arrayContaining(['runtime:unmount']));
  });

  it('relocateRememberedDeviceDirectory rejects a candidate already represented by another persisted mount with zero mutation', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Archive (moved)',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual(
        expect.arrayContaining([{ canDisconnect: true, name: 'Work' }]),
      );
    });
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'alreadyMounted', name: 'Archive' });
    unsubscribe();

    expect(updateRecordListMock).not.toHaveBeenCalled();
    expect(events).toEqual([]);
    // `alreadyMounted` is accepted only after the candidate marker and recovery target are
    // revalidated, so the marker inspection still runs even though the candidate is a duplicate.
    expect(inspectMioframeSpaceDirectoryMock).toHaveBeenCalledWith(candidateHandle);
  });

  it('relocateRememberedDeviceDirectory does not return alreadyMounted with zero mutation when the duplicate candidate marker is no longer valid', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Archive (moved)',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'invalidCandidate' });
    unsubscribe();

    expect(updateRecordListMock).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it('relocateRememberedDeviceDirectory returns invalidCandidate instead of alreadyMounted when the marker becomes invalid while duplicate-handle detection is pending', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Archive (moved)',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });

    let resolveDuplicateDetection: (() => void) | undefined;
    const isSameEntryMock = vi.fn(
      () =>
        new Promise<boolean>((resolve) => {
          resolveDuplicateDetection = () => {
            resolve(true);
          };
        }),
    );
    archiveHandle.isSameEntry = isSameEntryMock;

    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    const relocatePromise = service.relocateRememberedDeviceDirectory({
      handle: candidateHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    // Let relocation's turn start and reach the pending duplicate-handle detection before the
    // candidate marker is invalidated.
    await vi.waitFor(() => {
      expect(isSameEntryMock).toHaveBeenCalled();
    });

    // While duplicate-handle detection is still pending, the candidate marker becomes invalid.
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });

    // Duplicate-handle detection resolves (finding a duplicate); relocation must still perform the
    // canonical marker inspection afterwards, as the final preflight, before any terminal decision.
    resolveDuplicateDetection?.();

    await expect(relocatePromise).resolves.toEqual({ status: 'invalidCandidate' });
    unsubscribe();

    expect(updateRecordListMock).not.toHaveBeenCalled();
    expect(events).toEqual([]);
  });

  it('relocateRememberedDeviceDirectory observes a queued remove that runs first instead of a stale alreadyMounted', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Archive (moved)',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    let persistedRecords: Array<{ name: string; handle: FileSystemDirectoryHandle }> = [
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual(
        expect.arrayContaining([{ canDisconnect: true, name: 'Work' }]),
      );
    });

    // Queue the remove first (without awaiting it), then queue relocation immediately after: the
    // mutation queue guarantees the remove's turn commits before relocation's turn starts, so
    // relocation must observe the resulting current topology instead of the topology at call time.
    const removePromise = service.removeDeviceDirectory('Archive');
    const relocatePromise = service.relocateRememberedDeviceDirectory({
      handle: candidateHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    await expect(removePromise).resolves.toBeUndefined();
    await expect(relocatePromise).resolves.toEqual({
      status: 'relocated',
      name: 'Archive (moved)',
    });
  });

  it('relocateRememberedDeviceDirectory returns current alreadyMounted instead of persisting a duplicate mount when a queued add commits the candidate first', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const addedHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'shared-physical-entry',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Archive (moved)',
      permissionState: 'granted',
      sameEntryKey: 'shared-physical-entry',
    });
    let persistedRecords: Array<{ name: string; handle: FileSystemDirectoryHandle }> = [
      { name: 'Work', handle: workHandle },
    ];
    getRecordListMock.mockImplementation(() => Promise.resolve(persistedRecords));
    updateRecordListMock.mockImplementation((nextRecords) => {
      persistedRecords = nextRecords;
      return Promise.resolve(undefined);
    });

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual(
        expect.arrayContaining([{ canDisconnect: true, name: 'Work' }]),
      );
    });

    // Queue the add first (without awaiting it), then queue relocation immediately after: by the
    // time relocation's turn starts, the candidate is already persisted under `Archive`.
    const addPromise = service.addDeviceDirectory(addedHandle);
    const relocatePromise = service.relocateRememberedDeviceDirectory({
      handle: candidateHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    await expect(addPromise).resolves.toEqual({ name: 'Archive' });
    await expect(relocatePromise).resolves.toEqual({ status: 'alreadyMounted', name: 'Archive' });
    // Only the add persisted; relocation performed zero mutation once it observed the duplicate.
    expect(updateRecordListMock).toHaveBeenCalledTimes(1);
  });

  it('does not let a queued add start reading topology until a relocation mutation turn releases the queue', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const addedHandle = createDirectoryHandleMock({
      name: 'Extra',
      permissionState: 'granted',
      sameEntryKey: 'extra',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Work (moved)',
      permissionState: 'granted',
      sameEntryKey: 'moved',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    let releaseInspection: (() => void) | undefined;
    inspectMioframeSpaceDirectoryMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseInspection = () => {
            resolve({ looksLikeExistingSpace: true });
          };
        }),
    );
    getRecordListMock.mockClear();

    const relocatePromise = service.relocateRememberedDeviceDirectory({
      handle: candidateHandle,
      spaceName: 'Work',
      recoveryKey,
    });

    // Let relocation's turn actually start (its own initial topology read) and reach the pending
    // marker inspection before queuing the add behind it.
    await vi.waitFor(() => {
      expect(getRecordListMock).toHaveBeenCalledTimes(1);
    });

    const addPromise = service.addDeviceDirectory(addedHandle);

    // Flush several microtask turns: if the queue failed to serialize, the add's own topology
    // read would run during these ticks even though relocation has not released the queue yet.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(getRecordListMock).toHaveBeenCalledTimes(1);

    releaseInspection?.();

    await expect(relocatePromise).resolves.toEqual({ status: 'relocated', name: 'Work (moved)' });
    await expect(addPromise).resolves.toEqual({ name: 'Extra' });
    expect(getRecordListMock).toHaveBeenCalledTimes(2);
  });

  it('does not block a queued mutation behind a failed mutation', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    updateRecordListMock.mockRejectedValueOnce(new Error('storage write failed'));

    // Queue a failing mutation, then queue a second mutation immediately behind it (before the
    // first has even rejected): the second must still run once the queue releases.
    const failingAddPromise = service.addDeviceDirectory(archiveHandle);
    const removePromise = service.removeDeviceDirectory('Work');

    await expect(failingAddPromise).rejects.toThrow('storage write failed');
    await expect(removePromise).resolves.toBeUndefined();
    await expect(service.deviceFiles.fetch()).resolves.toEqual([]);
  });

  it('relocateRememberedDeviceDirectory aborts with zero mutation when handle-identity comparison against another record fails unexpectedly', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
      sameEntryKey: 'archive',
    });
    archiveHandle.isSameEntry = vi.fn(() => Promise.reject(new Error('identity check failed')));
    const candidateHandle = createDirectoryHandleMock({ name: 'Candidate' });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).rejects.toThrow('identity check failed');
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('relocateRememberedDeviceDirectory returns invalidCandidate with zero mutation when the marker disappeared before relocation', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Candidate',
      permissionState: 'granted',
      sameEntryKey: 'candidate',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    inspectMioframeSpaceDirectoryMock.mockResolvedValueOnce({ looksLikeExistingSpace: false });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).resolves.toEqual({ status: 'invalidCandidate' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('relocateRememberedDeviceDirectory returns missingRecord and mutates nothing when the target record disappeared', async () => {
    getRecordListMock.mockResolvedValue([]);
    const service = await createService();
    const candidateHandle = createDirectoryHandleMock({ name: 'Candidate' });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Missing',
        recoveryKey: 'irrelevant-key',
      }),
    ).resolves.toEqual({ status: 'missingRecord' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('leaves the previous runtime provider mounted when relocation fails to persist', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'granted',
      sameEntryKey: 'work',
    });
    const candidateHandle = createDirectoryHandleMock({
      name: 'Work (moved)',
      permissionState: 'granted',
      sameEntryKey: 'moved',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: workHandle }]);

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    updateRecordListMock.mockRejectedValueOnce(new Error('storage write failed'));
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.relocateRememberedDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).rejects.toThrow('storage write failed');
    unsubscribe();

    expect(events).toEqual([]);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
  });

  it('returns missingRecord when no persisted record matches the mounted space name', async () => {
    getRecordListMock.mockResolvedValue([]);
    const service = await createService();
    const candidateHandle = createDirectoryHandleMock({ name: 'Candidate' });

    await expect(
      service.reconnectDeviceDirectory({
        handle: candidateHandle,
        spaceName: 'Missing',
        recoveryKey: 'irrelevant-key',
      }),
    ).resolves.toEqual({ status: 'missingRecord' });
    expect(updateRecordListMock).not.toHaveBeenCalled();
  });

  it('leaves the previous runtime provider mounted when persisting the reconnect fails', async () => {
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

    const service = await createService();
    const recoveryKey = await captureRecoveryKeyFromUnavailableRoot({
      handle: workHandle,
      service,
      spaceName: 'Work',
    });
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    updateRecordListMock.mockRejectedValueOnce(new Error('storage write failed'));
    const events: Array<{ source: string; type: string }> = [];
    const unsubscribe = service.vfs.watch('/Device Files/Work', (event) => {
      events.push({ source: event.source, type: event.type });
    });

    await expect(
      service.reconnectDeviceDirectory({
        handle: reconnectedHandle,
        spaceName: 'Work',
        recoveryKey,
      }),
    ).rejects.toThrow('storage write failed');
    unsubscribe();

    expect(events).toEqual([]);
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      { canDisconnect: true, name: 'Work' },
    ]);
  });

  it('returns undefined for an unknown file-system access request key', async () => {
    const service = await createService();

    await expect(
      service.getFileSystemAccessRequest({
        operation: 'write',
        spaceName: 'Missing',
      }),
    ).resolves.toBeUndefined();
  });

  it('returns a temporary handle for the broker when a file-system access request is pending', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });

    await service.directoryContent.fetch({
      path: '/Device Files/Work',
    });

    await expect(
      service.getTemporaryFileSystemAccessHandle({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toMatchObject({
      handle: promptHandle,
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('keeps remembered spaces mounted and exposes a pending access request when provider access is missing', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });

    const error = await service.directoryContent.fetch({
      path: '/Device Files/Work',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'read',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected DeviceDirectoryAccessRequiredError');
    }

    const serialized = error.toJSON();

    expect(serialized).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      message: 'Permission required to open this remembered local space',
      mode: 'read',
      spaceName: 'Work',
    });
    expect(serialized).not.toHaveProperty('cause');
    expect(JSON.stringify(serialized)).not.toContain('sameEntryKey');

    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(promptHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('clears pending access requests on grant and keeps remembered spaces after denial', async () => {
    const deniedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'denied',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: deniedHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });

    const error = await service.directoryContent.fetch({
      path: '/Device Files/Work',
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'read',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected DeviceDirectoryAccessRequiredError');
    }

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'denied',
        recoveryKey: prepared.recoveryKey,
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({
      status: 'denied',
    });

    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
    await expect(service.deviceFiles.fetch()).resolves.toEqual([
      {
        canDisconnect: true,
        name: 'Work',
      },
    ]);
  });

  it('returns cancelled when the browser still reports prompt state after a recovery attempt', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });

    const error = await service.directoryContent.fetch({
      path: '/Device Files/Work',
    });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected DeviceDirectoryAccessRequiredError');
    }

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'prompt',
        recoveryKey: prepared.recoveryKey,
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({
      status: 'cancelled',
    });

    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('deduplicates pending requests for the same remembered space and mode', async () => {
    const firstHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    const secondHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: firstHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });

    await service.directoryContent.fetch({ path: '/Device Files/Work' });
    const firstError = await service.fsNodeStat.fetch({ path: '/Device Files/Work/file.txt' });

    expect(firstError).toBeInstanceOf(Error);
    if (!isAccessErrorWithRecoveryKey(firstError)) {
      throw new Error('Expected first access error');
    }

    await service.addDeviceDirectory(secondHandle);
    const secondError = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    expect(secondError).toBeInstanceOf(Error);
    if (!isAccessErrorWithRecoveryKey(secondError)) {
      throw new Error('Expected second access error');
    }

    expect(secondError.spaceName).toBe(firstError.spaceName);
    expect(secondError.mode).toBe(firstError.mode);
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: firstError.spaceName,
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('clears the pending request after permission is granted', async () => {
    const grantedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: grantedHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    grantedHandle.queryPermissionMock?.mockResolvedValue('granted');

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'granted',
        recoveryKey: prepared.recoveryKey,
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({ status: 'granted' });

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: error.spaceName }),
    ).resolves.toBeUndefined();
  });

  it('clears only pending requests for the space when that directory is removed', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: error.spaceName }),
    ).resolves.toEqual({ operation: 'read', spaceName: 'Work' });

    await service.removeDeviceDirectory('Work');

    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: error.spaceName }),
    ).resolves.toBeUndefined();
  });

  it('emits a provider refresh event through VFS watch integration after permission is granted', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    const watchedEvents: string[] = [];
    const unwatch = service.vfs.watch('/Device Files/Work', () => {
      watchedEvents.push('refetched');
    });

    promptHandle.queryPermissionMock?.mockResolvedValue('granted');

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await service.resolveFileSystemAccessRequest({
      operation: 'read',
      permissionState: 'granted',
      recoveryKey: prepared.recoveryKey,
      spaceName: error.spaceName,
    });

    unwatch();
    expect(watchedEvents).toEqual(['refetched']);
  });

  it('resolveFileSystemAccessRequest returns granted and triggers provider refresh', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    promptHandle.queryPermissionMock?.mockResolvedValue('granted');

    const watchedEvents: string[] = [];
    const unwatch = service.vfs.watch('/Device Files/Work', () => {
      watchedEvents.push('refetched');
    });

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'granted',
        recoveryKey: prepared.recoveryKey,
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({ status: 'granted' });

    unwatch();
    expect(watchedEvents).toEqual(['refetched']);
  });

  it('write access grant waits for registered recovery handlers before returning granted', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const createError = await service
      .createDirectory('/Device Files/Work/new-directory')
      .catch((error: unknown) => error);

    if (!isAccessErrorWithRecoveryKey(createError)) {
      throw new Error('Expected access error');
    }

    const handler = vi.fn().mockResolvedValue({ status: 'flushed' as const });
    const unregister = service.registerWriteAccessRecoveryHandler(handler);

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'write',
      spaceName: createError.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'write',
        permissionState: 'granted',
        recoveryKey: prepared.recoveryKey,
        spaceName: createError.spaceName,
      }),
    ).resolves.toEqual({ status: 'granted' });
    expect(handler).toHaveBeenCalledWith({
      mountPath: '/Device Files/Work',
      operation: 'write',
      spaceName: 'Work',
    });

    unregister();
  });

  it('write access grant returns grantedWithReplayFailures when a recovery handler remains permission-blocked', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const createError = await service
      .createDirectory('/Device Files/Work/new-directory')
      .catch((error: unknown) => error);

    if (!isAccessErrorWithRecoveryKey(createError)) {
      throw new Error('Expected access error');
    }

    const handler = vi.fn().mockResolvedValue({ status: 'stillBlocked' as const });
    const unregister = service.registerWriteAccessRecoveryHandler(handler);

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'write',
      spaceName: createError.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'write',
        permissionState: 'granted',
        recoveryKey: prepared.recoveryKey,
        spaceName: createError.spaceName,
      }),
    ).resolves.toEqual({ status: 'grantedWithReplayFailures' });

    unregister();
  });

  it('write access grant returns grantedWithStorageFailures when a recovery handler reports a non-retryable failure', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const createError = await service
      .createDirectory('/Device Files/Work/new-directory')
      .catch((error: unknown) => error);

    if (!isAccessErrorWithRecoveryKey(createError)) {
      throw new Error('Expected access error');
    }

    const handler = vi.fn().mockResolvedValue({ status: 'failed' as const });
    const unregister = service.registerWriteAccessRecoveryHandler(handler);

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'write',
      spaceName: createError.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'write',
        permissionState: 'granted',
        recoveryKey: prepared.recoveryKey,
        spaceName: createError.spaceName,
      }),
    ).resolves.toEqual({ status: 'grantedWithStorageFailures' });

    unregister();
  });

  it('resolveFileSystemAccessRequest returns denied when browser denies', async () => {
    const deniedHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'denied',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: deniedHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: error.spaceName,
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'denied',
        recoveryKey: prepared.recoveryKey,
        spaceName: error.spaceName,
      }),
    ).resolves.toEqual({ status: 'denied' });
  });

  it('resolveFileSystemAccessRequest returns missing for an unknown key', async () => {
    const service = await createService();

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'granted',
        recoveryKey: 'irrelevant-key',
        spaceName: 'Missing',
      }),
    ).resolves.toEqual({ status: 'missing' });
  });

  it('a deferred old-provider access check completing after same-name replacement cannot overwrite the current provider request', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: oldHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    // Hold the old provider's read permission check pending across the replacement below.
    let releaseOldCheck: ((state: PermissionState) => void) | undefined;
    const deferredPermission = new Promise<PermissionState>((resolve) => {
      releaseOldCheck = resolve;
    });
    oldHandle.queryPermissionMock?.mockImplementation(() => deferredPermission);

    const oldReadPromise = service.directoryContent.fetch({ path: '/Device Files/Work' });

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }]);
    await service.addDeviceDirectory(replacementHandle);

    // The current (replacement) provider registers its own request through an independent query
    // so it does not share the still-pending `directoryContent$` subscription above.
    const currentStatError = await service.fsNodeStat
      .fetch({ path: '/Device Files/Work/child.txt' })
      .catch((caughtError: unknown) => caughtError);

    if (!isAccessErrorWithRecoveryKey(currentStatError)) {
      throw new Error('Expected the replacement provider to require access');
    }

    const currentPrepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: 'Work',
    });

    if (!currentPrepared) {
      throw new Error('Expected the current provider request to be registered');
    }

    expect(currentPrepared.handle).toBe(replacementHandle);

    // Release the deferred old check; it resolves non-granted and its callback fires late.
    releaseOldCheck?.('prompt');
    const oldReadResult = await oldReadPromise;

    // The stale provider declined actionable recovery instead of overwriting the current request.
    expect(oldReadResult).toBeInstanceOf(Error);
    expect(isAccessErrorWithRecoveryKey(oldReadResult)).toBe(false);

    await expect(
      service.getTemporaryFileSystemAccessHandle({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toEqual(currentPrepared);
  });

  it('a deferred old-provider access check completing after removal with no replacement creates no actionable pending request', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    let releaseCheck: ((state: PermissionState) => void) | undefined;
    const deferredPermission = new Promise<PermissionState>((resolve) => {
      releaseCheck = resolve;
    });
    handle.queryPermissionMock?.mockImplementation(() => deferredPermission);

    const readPromise = service.directoryContent.fetch({ path: '/Device Files/Work' });

    await service.removeDeviceDirectory('Work');

    releaseCheck?.('prompt');
    const readResult = await readPromise;

    expect(readResult).toBeInstanceOf(Error);
    expect(isAccessErrorWithRecoveryKey(readResult)).toBe(false);
    await expect(
      service.getFileSystemAccessRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
  });

  it('a stale-key resolve from an old provider prompt cannot resolve, refresh, or replay the current same-name provider request (read)', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: oldHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    // An old-provider request was prepared (its handle/key captured) before replacement, mirroring
    // an already-started browser prompt.
    await service.directoryContent.fetch({ path: '/Device Files/Work' });
    const oldPrepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: 'Work',
    });

    if (!oldPrepared) {
      throw new Error('Expected the old provider request to be registered');
    }
    expect(oldPrepared.handle).toBe(oldHandle);

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }]);
    await service.addDeviceDirectory(replacementHandle);

    const currentError = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(currentError)) {
      throw new Error('Expected the replacement provider to require access');
    }

    const currentPrepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: 'Work',
    });

    if (!currentPrepared) {
      throw new Error('Expected the current provider request to be registered');
    }
    expect(currentPrepared.handle).toBe(replacementHandle);
    expect(currentPrepared.recoveryKey).not.toBe(oldPrepared.recoveryKey);

    // The old prompt resolves late, correlated by its now-stale key.
    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'granted',
        recoveryKey: oldPrepared.recoveryKey,
        spaceName: 'Work',
      }),
    ).resolves.toEqual({ status: 'missing' });

    // The current request survives untouched.
    await expect(
      service.getTemporaryFileSystemAccessHandle({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toEqual(currentPrepared);

    // Its own later prepare/resolve cycle still succeeds normally, using its own key.
    replacementHandle.queryPermissionMock?.mockResolvedValue('granted');
    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'read',
        permissionState: 'granted',
        recoveryKey: currentPrepared.recoveryKey,
        spaceName: 'Work',
      }),
    ).resolves.toEqual({ status: 'granted' });
  });

  it('a stale-key resolve from an old provider prompt does not invoke write-recovery handlers for the current provider request (write)', async () => {
    const oldHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    const replacementHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'shared-handle',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: oldHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const oldWriteError = await service
      .createDirectory('/Device Files/Work/old-folder')
      .catch((caughtError: unknown) => caughtError);

    if (!isAccessErrorWithRecoveryKey(oldWriteError)) {
      throw new Error('Expected the old provider to require write access');
    }
    const oldPrepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'write',
      spaceName: 'Work',
    });

    if (!oldPrepared) {
      throw new Error('Expected the old provider write request to be registered');
    }

    getRecordListMock
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }])
      .mockResolvedValueOnce([{ name: 'Work', handle: oldHandle }]);
    await service.addDeviceDirectory(replacementHandle);

    const currentWriteError = await service
      .createDirectory('/Device Files/Work/new-folder')
      .catch((caughtError: unknown) => caughtError);

    if (!isAccessErrorWithRecoveryKey(currentWriteError)) {
      throw new Error('Expected the replacement provider to require write access');
    }
    const currentPrepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'write',
      spaceName: 'Work',
    });

    if (!currentPrepared) {
      throw new Error('Expected the current provider write request to be registered');
    }

    const handler = vi.fn().mockResolvedValue({ status: 'flushed' as const });
    const unregister = service.registerWriteAccessRecoveryHandler(handler);

    await expect(
      service.resolveFileSystemAccessRequest({
        operation: 'write',
        permissionState: 'granted',
        recoveryKey: oldPrepared.recoveryKey,
        spaceName: 'Work',
      }),
    ).resolves.toEqual({ status: 'missing' });
    expect(handler).not.toHaveBeenCalled();

    await expect(
      service.getTemporaryFileSystemAccessHandle({ operation: 'write', spaceName: 'Work' }),
    ).resolves.toEqual(currentPrepared);

    unregister();
  });

  it('getTemporaryFileSystemAccessHandle returns undefined for an unknown key', async () => {
    const service = await createService();

    await expect(
      service.getTemporaryFileSystemAccessHandle({
        operation: 'write',
        spaceName: 'Missing',
      }),
    ).resolves.toBeUndefined();
  });

  it('cancelFileSystemAccessRequest returns false for unknown key', async () => {
    const service = await createService();

    await expect(
      service.cancelFileSystemAccessRequest({
        operation: 'write',
        spaceName: 'Missing',
      }),
    ).resolves.toBe(false);
  });

  it('keeps read and write pending requests separate for the same remembered space', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'granted',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });

    const readResult = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    expect(readResult).toEqual([]);

    const writeError = await service
      .createDirectory('/Device Files/Work/next-folder')
      .catch((caughtError: unknown) => caughtError);

    expect(writeError).toMatchObject({
      mode: 'readwrite',
      spaceName: 'Work',
    });
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'write',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      operation: 'write',
      spaceName: 'Work',
    });
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toBeUndefined();
  });

  it('reactively refreshes directoryContent$ after permission is granted without a route retry', async () => {
    const noteHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const promptHandle = createDirectoryHandleMock({
      entries: [noteHandle],
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const results: Array<[string, FSNodeStat][] | Error> = [];
    const subscription = service
      .directoryContent$({ path: '/Device Files/Work' })
      .subscribe((value) => {
        results.push(value);
      });

    await vi.waitFor(() => {
      expect(results).toContainEqual(
        expect.objectContaining({
          mode: 'read',
          spaceName: 'Work',
        }),
      );
    });

    promptHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );
    noteHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: 'Work',
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await service.resolveFileSystemAccessRequest({
      operation: 'read',
      permissionState: 'granted',
      recoveryKey: prepared.recoveryKey,
      spaceName: 'Work',
    });

    await vi.waitFor(() => {
      expect(results).toContainEqual([
        [
          'note.txt',
          expect.objectContaining({
            type: FSNodeType.File,
          }),
        ],
      ]);
    });

    subscription.unsubscribe();
  });

  it('reactively refreshes fsNodeStat$ after permission is granted without remounting the route', async () => {
    const noteHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const promptHandle = createDirectoryHandleMock({
      entries: [noteHandle],
      name: 'Work',
      permissionState: 'prompt',
      readPermissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        { canDisconnect: true, name: 'Work' },
      ]);
    });
    const results: Array<FSNodeStat | Error> = [];
    const subscription = service.fsNodeStat$({ path: '/Device Files/Work' }).subscribe((value) => {
      results.push(value);
    });

    await vi.waitFor(() => {
      expect(results).toContainEqual(
        expect.objectContaining({
          mode: 'read',
          spaceName: 'Work',
        }),
      );
    });

    promptHandle.queryPermissionMock?.mockImplementation((descriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? 'granted' : 'prompt'),
    );

    const prepared = await service.getTemporaryFileSystemAccessHandle({
      operation: 'read',
      spaceName: 'Work',
    });

    if (!prepared) {
      throw new Error('Expected a pending access request');
    }

    await service.resolveFileSystemAccessRequest({
      operation: 'read',
      permissionState: 'granted',
      recoveryKey: prepared.recoveryKey,
      spaceName: 'Work',
    });

    await vi.waitFor(() => {
      expect(results).toContainEqual(
        expect.objectContaining({
          capabilities: expect.objectContaining({
            canEditChildren: undefined,
          }),
          type: FSNodeType.Directory,
        }),
      );
    });

    subscription.unsubscribe();
  });

  it('cancels pending requests explicitly and recreates them on a later access attempt', async () => {
    const promptHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    getRecordListMock.mockResolvedValue([{ name: 'Work', handle: promptHandle }]);

    const service = await createService();
    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
      ]);
    });
    const error = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    if (!isAccessErrorWithRecoveryKey(error)) {
      throw new Error('Expected access error');
    }

    await expect(
      service.cancelFileSystemAccessRequest({
        operation: 'read',
        spaceName: error.spaceName,
      }),
    ).resolves.toBe(true);
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: error.spaceName,
      }),
    ).resolves.toBeUndefined();

    const nextError = await service.directoryContent.fetch({ path: '/Device Files/Work' });

    expect(nextError).toMatchObject({
      mode: 'read',
      spaceName: 'Work',
    });
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('clears only pending requests for the removed remembered space', async () => {
    const workHandle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    const archiveHandle = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'prompt',
      sameEntryKey: 'archive',
    });
    getRecordListMock.mockResolvedValue([
      { name: 'Work', handle: workHandle },
      { name: 'Archive', handle: archiveHandle },
    ]);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: true,
          name: 'Work',
        },
        {
          canDisconnect: true,
          name: 'Archive',
        },
      ]);
    });
    await service.directoryContent.fetch({ path: '/Device Files/Work' });
    await service.directoryContent.fetch({ path: '/Device Files/Archive' });

    await service.removeDeviceDirectory('Work');

    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toBeUndefined();
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'read',
        spaceName: 'Archive',
      }),
    ).resolves.toEqual({
      operation: 'read',
      spaceName: 'Archive',
    });
  });

  it('keeps Browser Storage mounted without routing OPFS through local access recovery', async () => {
    const opfsHandle = createDirectoryHandleMock({
      name: OPFSName,
      permissionState: 'prompt',
      sameEntryKey: 'opfs',
    });
    getDirectoryMock.mockResolvedValue(opfsHandle);

    const service = await createService();

    await vi.waitFor(async () => {
      await expect(service.deviceFiles.fetch()).resolves.toEqual([
        {
          canDisconnect: false,
          name: OPFSName,
        },
      ]);
    });

    const result = await service.directoryContent.fetch({
      path: `/Device Files/${OPFSName}`,
    });

    expect(result).toEqual([]);
    await expect(
      service.getFileSystemAccessRequest({
        operation: 'write',
        spaceName: OPFSName,
      }),
    ).resolves.toBeUndefined();
    expect(opfsHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('re-reads directoryContent$ and emits an updated payload after createDirectory', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([['new-folder', directoryStat]]);
    const createDirectoryMock = vi
      .fn<(path: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    const { provider } = createDiagnosticProvider({
      createDirectory: createDirectoryMock,
      readDirectory: readDirectoryMock,
    });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    const results: [string, FSNodeStat][][] = [];
    const subscription = service.directoryContent$({ path: '/drive/folder' }).subscribe((value) => {
      if (!(value instanceof Error)) {
        results.push(value);
      }
    });

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(1);
    });

    await service.createDirectory('/drive/folder/new-folder');

    await vi.waitFor(() => {
      expect(readDirectoryMock).toHaveBeenCalledTimes(2);
      expect(results).toEqual([[], [['new-folder', directoryStat]]]);
    });
    expect(createDirectoryMock).toHaveBeenCalledWith('/folder/new-folder');

    subscription.unsubscribe();
  });

  it('filters automerge files from directoryContent$ when requested', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        ['storage-adapter-id.automerge', fileStat],
        ['visible.txt', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: { hideAutomergeFiles: true },
      }),
    ).resolves.toEqual([['visible.txt', fileStat]]);
  });

  it('keeps repository storage files visible because repository filtering is owned elsewhere', async () => {
    const documentStorageFileName = createDocumentStorageFileName();
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        [storageAdapterMarkerFileName, fileStat],
        [documentStorageFileName, fileStat],
        ['visible.txt', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: { hideAutomergeFiles: true },
      }),
    ).resolves.toEqual([['visible.txt', fileStat]]);

    const entriesWithAutomergeFiles = await service.directoryContent.fetch({
      path: '/drive/folder',
      options: { hideAutomergeFiles: false },
    });

    expect(entriesWithAutomergeFiles).toEqual(
      expect.arrayContaining([
        [documentStorageFileName, fileStat],
        [storageAdapterMarkerFileName, fileStat],
        ['visible.txt', fileStat],
      ]),
    );
    expect(entriesWithAutomergeFiles).toHaveLength(3);
  });

  it('filters v2 compact .am automerge storage files and preserves unrelated .am files', async () => {
    const v2StorageFileName = createV2DocumentStorageFileName();
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockResolvedValue([
        [v2StorageFileName, fileStat],
        ['user-notes.am', fileStat],
      ]);
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(
      service.directoryContent.fetch({
        path: '/drive/folder',
        options: { hideAutomergeFiles: true },
      }),
    ).resolves.toEqual([['user-notes.am', fileStat]]);
  });

  it('emits errors as values for directoryContent$ and forwards non-Error failures to the observable error channel', async () => {
    const readDirectoryMock = vi
      .fn<(path: string) => Promise<[string, FSNodeStat][]>>()
      .mockRejectedValueOnce(new Error('read failed'))
      .mockRejectedValueOnce('directory failed');
    const { provider } = createDiagnosticProvider({ readDirectory: readDirectoryMock });
    const service = await createService();

    await service.createDirectory('/drive');
    service.vfs.mount('/drive', provider);

    await expect(service.directoryContent.fetch({ path: '/drive/folder' })).resolves.toBeInstanceOf(
      Error,
    );

    const errors: unknown[] = [];
    const subscription = service.directoryContent$({ path: '/drive/folder' }).subscribe({
      error: (error) => {
        errors.push(error);
      },
    });

    await vi.waitFor(() => {
      expect(errors).toEqual(['directory failed']);
    });
    subscription.unsubscribe();
  });
});
