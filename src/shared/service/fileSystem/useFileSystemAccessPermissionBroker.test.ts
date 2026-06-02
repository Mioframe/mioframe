import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';
import { createDirectoryHandleMock } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider.testUtils';

const prepareFileSystemAccessRequestMock = vi.fn();
const resolveFileSystemAccessRequestMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      prepareFileSystemAccessRequest: prepareFileSystemAccessRequestMock,
      resolveFileSystemAccessRequest: resolveFileSystemAccessRequestMock,
    },
  }),
}));

const mountBroker = async () => {
  const scope = effectScope();
  let broker:
    | ReturnType<
        typeof import('./useFileSystemAccessPermissionBroker').useFileSystemAccessPermissionBroker
      >
    | undefined;
  const { useFileSystemAccessPermissionBroker } =
    await import('./useFileSystemAccessPermissionBroker');

  scope.run(() => {
    broker = useFileSystemAccessPermissionBroker();
  });

  if (!broker) {
    throw new Error('Expected permission broker');
  }

  return {
    broker,
    scope,
  };
};

describe('useFileSystemAccessPermissionBroker', () => {
  afterEach(() => {
    prepareFileSystemAccessRequestMock.mockReset();
    resolveFileSystemAccessRequestMock.mockReset();
  });

  it('prepares a temporary handle without exposing it through the public state', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    prepareFileSystemAccessRequestMock.mockResolvedValue({
      handle,
      operation: 'read',
      spaceName: 'Work',
    });

    const { broker, scope } = await mountBroker();

    await expect(
      broker.prepareAccessRequest({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toMatchObject({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(broker.hasPreparedRequest.value).toBe(true);

    scope.stop();
  });

  it('requests permission on the main thread and clears the prepared handle after grant', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('granted');
    prepareFileSystemAccessRequestMock.mockResolvedValue({
      handle,
      operation: 'read',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'granted',
    });

    const { broker, scope } = await mountBroker();

    await broker.prepareAccessRequest({
      operation: 'read',
      spaceName: 'Work',
    });

    await expect(
      broker.requestPreparedAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'granted',
    });
    expect(handle.requestPermissionMock).toHaveBeenCalledWith({ mode: 'read' });
    expect(resolveFileSystemAccessRequestMock).toHaveBeenCalledWith({
      operation: 'read',
      permissionState: 'granted',
      spaceName: 'Work',
    });
    expect(broker.hasPreparedRequest.value).toBe(false);

    scope.stop();
  });

  it('uses readwrite mode for write recovery and still clears the handle after denial', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'denied',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockResolvedValue('denied');
    prepareFileSystemAccessRequestMock.mockResolvedValue({
      handle,
      operation: 'write',
      spaceName: 'Work',
    });
    resolveFileSystemAccessRequestMock.mockResolvedValue({
      status: 'denied',
    });

    const { broker, scope } = await mountBroker();

    await broker.prepareAccessRequest({
      operation: 'write',
      spaceName: 'Work',
    });

    await expect(
      broker.requestPreparedAccess({
        operation: 'write',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'denied',
    });
    expect(handle.requestPermissionMock).toHaveBeenCalledWith({ mode: 'readwrite' });
    expect(broker.hasPreparedRequest.value).toBe(false);

    scope.stop();
  });

  it('returns error and clears the prepared handle when requestPermission rejects', async () => {
    const handle = createDirectoryHandleMock({
      name: 'Work',
      permissionState: 'prompt',
      sameEntryKey: 'work',
    });
    handle.requestPermissionMock.mockRejectedValue(new DOMException('User activation required'));
    prepareFileSystemAccessRequestMock.mockResolvedValue({
      handle,
      operation: 'read',
      spaceName: 'Work',
    });

    const { broker, scope } = await mountBroker();

    await broker.prepareAccessRequest({
      operation: 'read',
      spaceName: 'Work',
    });

    await expect(
      broker.requestPreparedAccess({
        operation: 'read',
        spaceName: 'Work',
      }),
    ).resolves.toEqual({
      status: 'error',
    });
    expect(resolveFileSystemAccessRequestMock).not.toHaveBeenCalled();
    expect(broker.hasPreparedRequest.value).toBe(false);

    scope.stop();
  });
});
