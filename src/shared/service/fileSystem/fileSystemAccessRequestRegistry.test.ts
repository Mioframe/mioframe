import { describe, expect, it, vi } from 'vitest';
import { DEVICE_FILES_ROOT_NAME } from '@shared/lib/deviceFileSystemProvider';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';
import { createFileSystemAccessRequestRegistry } from './fileSystemAccessRequestRegistry';

const deviceFilesPath = PathUtils.join('/', DEVICE_FILES_ROOT_NAME);

const createHandleMock = () =>
  createDirectoryHandleMock({ name: 'mock', permissionState: 'prompt', sameEntryKey: 'mock' });

const createRegistry = () => createFileSystemAccessRequestRegistry({ deviceFilesPath });

describe('fileSystemAccessRequestRegistry', () => {
  it('upsert replaces an existing pending request for the same spaceName and mode', async () => {
    const registry = createRegistry();
    const firstHandle = createHandleMock();
    const secondHandle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({
      spaceName: 'Work',
      handle: firstHandle,
      mode: 'read',
      refreshProvider,
    });
    registry.upsertRequest({
      spaceName: 'Work',
      handle: secondHandle,
      mode: 'read',
      refreshProvider,
    });

    const prepared = await registry.prepareHandle({ operation: 'read', spaceName: 'Work' });

    expect(prepared?.handle).toBe(secondHandle);
  });

  it('prepare returns a temporary handle when a matching request exists', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    const result = await registry.prepareHandle({ operation: 'read', spaceName: 'Work' });

    expect(result).toMatchObject({ handle, operation: 'read', spaceName: 'Work' });
  });

  it('prepare returns undefined when no matching request exists', async () => {
    const registry = createRegistry();

    await expect(
      registry.prepareHandle({ operation: 'read', spaceName: 'Missing' }),
    ).resolves.toBeUndefined();
  });

  it('resolve returns missing for stale requests', async () => {
    const registry = createRegistry();

    await expect(
      registry.resolve({ operation: 'read', spaceName: 'Missing', permissionState: 'granted' }),
    ).resolves.toEqual({ status: 'missing' });
  });

  it('resolve returns denied for denied permission', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    await expect(
      registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'denied' }),
    ).resolves.toEqual({ status: 'denied' });
  });

  it('resolve returns cancelled for prompt permission state', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    await expect(
      registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'prompt' }),
    ).resolves.toEqual({ status: 'cancelled' });
  });

  it('read recovery does not run write recovery handlers', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'flushed' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    await expect(
      registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'granted' }),
    ).resolves.toEqual({ status: 'granted' });

    expect(writeHandler).not.toHaveBeenCalled();
  });

  it('write recovery refreshes provider before running handlers', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const callOrder: string[] = [];
    const refreshProvider = vi.fn().mockImplementation(() => {
      callOrder.push('refresh');
      return Promise.resolve();
    });
    const writeHandler = vi.fn().mockImplementation(() => {
      callOrder.push('handler');
      return Promise.resolve({ status: 'flushed' as const });
    });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    await registry.resolve({ operation: 'write', spaceName: 'Work', permissionState: 'granted' });

    expect(callOrder).toEqual(['refresh', 'handler']);
  });

  it('write recovery passes correct context to handler', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'flushed' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    await registry.resolve({ operation: 'write', spaceName: 'Work', permissionState: 'granted' });

    expect(writeHandler).toHaveBeenCalledWith({
      mountPath: PathUtils.join(deviceFilesPath, 'Work'),
      operation: 'write',
      spaceName: 'Work',
    });
  });

  it('stillBlocked handler result maps to grantedWithReplayFailures', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'stillBlocked' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    await expect(
      registry.resolve({ operation: 'write', spaceName: 'Work', permissionState: 'granted' }),
    ).resolves.toMatchObject({ status: 'grantedWithReplayFailures' });
  });

  it('stillBlocked handler with replay summary forwards replay counters and classification', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({
      status: 'stillBlocked' as const,
      replay: {
        flushedCount: 2,
        pendingCount: 3,
        failureClassification: 'accessRequired' as const,
      },
    });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    const result = await registry.resolve({
      operation: 'write',
      spaceName: 'Work',
      permissionState: 'granted',
    });

    expect(result).toMatchObject({
      status: 'grantedWithReplayFailures',
      replay: { flushedCount: 2, pendingCount: 3, failureClassification: 'accessRequired' },
    });
  });

  it('stillBlocked handler without replay summary forwards result without replay', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'stillBlocked' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    const result = await registry.resolve({
      operation: 'write',
      spaceName: 'Work',
      permissionState: 'granted',
    });

    expect(result).toMatchObject({ status: 'grantedWithReplayFailures' });
    expect('replay' in result && result.replay).toBeUndefined();
  });

  it('failed handler result maps to grantedWithStorageFailures', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'failed' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    await expect(
      registry.resolve({ operation: 'write', spaceName: 'Work', permissionState: 'granted' }),
    ).resolves.toMatchObject({ status: 'grantedWithStorageFailures' });
  });

  it('failed handler with replay summary forwards replay counters and classification', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({
      status: 'failed' as const,
      replay: {
        flushedCount: 0,
        pendingCount: 1,
        failureClassification: 'storageFailure' as const,
      },
    });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    const result = await registry.resolve({
      operation: 'write',
      spaceName: 'Work',
      permissionState: 'granted',
    });

    expect(result).toMatchObject({
      status: 'grantedWithStorageFailures',
      replay: { flushedCount: 0, pendingCount: 1, failureClassification: 'storageFailure' },
    });
  });

  it('resolve result does not contain space name, path, or document id', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({
      status: 'stillBlocked' as const,
      replay: {
        flushedCount: 1,
        pendingCount: 2,
        failureClassification: 'accessRequired' as const,
      },
    });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.registerWriteRecoveryHandler(writeHandler);

    const result = await registry.resolve({
      operation: 'write',
      spaceName: 'Work',
      permissionState: 'granted',
    });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('Work');
    expect(serialized).not.toContain('path');
    expect(serialized).not.toContain('spaceName');
  });

  it('clearing by space name removes all pending requests for that space', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });
    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    registry.upsertRequest({ spaceName: 'Archive', handle, mode: 'read', refreshProvider });

    registry.clearForSpace('Work');

    await expect(
      registry.getRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
    await expect(
      registry.getRequest({ operation: 'write', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
    await expect(registry.getRequest({ operation: 'read', spaceName: 'Archive' })).resolves.toEqual(
      { operation: 'read', spaceName: 'Archive' },
    );
  });

  it('unregistering a write recovery handler stops invoking it', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);
    const writeHandler = vi.fn().mockResolvedValue({ status: 'flushed' as const });

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });
    const unregister = registry.registerWriteRecoveryHandler(writeHandler);
    unregister();

    await registry.resolve({ operation: 'write', spaceName: 'Work', permissionState: 'granted' });

    expect(writeHandler).not.toHaveBeenCalled();
  });

  it('cancelled prompt keeps the pending request alive for retry', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    await registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'prompt' });

    await expect(registry.getRequest({ operation: 'read', spaceName: 'Work' })).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('denied permission keeps the pending request alive', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    await registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'denied' });

    await expect(registry.getRequest({ operation: 'read', spaceName: 'Work' })).resolves.toEqual({
      operation: 'read',
      spaceName: 'Work',
    });
  });

  it('granted permission removes the pending request', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });
    await registry.resolve({ operation: 'read', spaceName: 'Work', permissionState: 'granted' });

    await expect(
      registry.getRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
  });

  it('cancel removes a pending request and returns true', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });

    await expect(registry.cancel({ operation: 'read', spaceName: 'Work' })).resolves.toBe(true);
    await expect(
      registry.getRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
  });

  it('cancel returns false for an unknown key', async () => {
    const registry = createRegistry();

    await expect(registry.cancel({ operation: 'read', spaceName: 'Missing' })).resolves.toBe(false);
  });

  it('read and write requests for the same space are independent', async () => {
    const registry = createRegistry();
    const handle = createHandleMock();
    const refreshProvider = vi.fn().mockResolvedValue(undefined);

    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'read', refreshProvider });
    registry.upsertRequest({ spaceName: 'Work', handle, mode: 'readwrite', refreshProvider });

    await registry.cancel({ operation: 'read', spaceName: 'Work' });

    await expect(
      registry.getRequest({ operation: 'read', spaceName: 'Work' }),
    ).resolves.toBeUndefined();
    await expect(registry.getRequest({ operation: 'write', spaceName: 'Work' })).resolves.toEqual({
      operation: 'write',
      spaceName: 'Work',
    });
  });
});
