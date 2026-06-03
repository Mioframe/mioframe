import { PathUtils } from '@shared/lib/virtualFileSystem';
import type { WebFileSystemAccessMode } from '@shared/lib/webFileSystemProvider';
import type { FileSystemAccessOperation } from '@shared/lib/fileSystem';

type DeviceDirectoryAccessRequest = {
  spaceName: string;
  handle: FileSystemDirectoryHandle;
  mode: WebFileSystemAccessMode;
  refreshProvider: () => Promise<void>;
};

type DeviceDirectoryAccessRequestKey = Pick<DeviceDirectoryAccessRequest, 'spaceName' | 'mode'>;

export type WriteAccessRecoveryResult = {
  status: 'failed' | 'flushed' | 'stillBlocked';
};

type WriteAccessRecoveryContext = {
  mountPath: string;
  operation: 'write';
  spaceName: string;
};

export type WriteAccessRecoveryHandler = (
  context: WriteAccessRecoveryContext,
) => Promise<WriteAccessRecoveryResult>;

export type FileSystemAccessRequestKey = {
  operation: FileSystemAccessOperation;
  spaceName: string;
};

export type ResolveAccessRequestResult = {
  status:
    | 'granted'
    | 'denied'
    | 'cancelled'
    | 'missing'
    | 'grantedWithReplayFailures'
    | 'grantedWithStorageFailures';
};

const operationToMode = (operation: FileSystemAccessOperation): WebFileSystemAccessMode =>
  operation === 'write' ? 'readwrite' : 'read';

const makeRequestKey = ({ mode, spaceName }: DeviceDirectoryAccessRequestKey) =>
  `${spaceName}:${mode}`;

/**
 * Creates a service-internal registry for pending device directory access requests
 * and write access recovery handlers.
 */
export const createFileSystemAccessRequestRegistry = ({
  deviceFilesPath,
}: {
  deviceFilesPath: string;
}) => {
  const pendingRequests = new Map<string, DeviceDirectoryAccessRequest>();
  const writeRecoveryHandlers = new Set<WriteAccessRecoveryHandler>();

  const deleteRequest = (key: DeviceDirectoryAccessRequestKey) =>
    pendingRequests.delete(makeRequestKey(key));

  const upsertRequest = ({
    handle,
    mode,
    refreshProvider,
    spaceName,
  }: {
    handle: FileSystemDirectoryHandle;
    mode: WebFileSystemAccessMode;
    refreshProvider: () => Promise<void>;
    spaceName: string;
  }): DeviceDirectoryAccessRequestKey => {
    const key = makeRequestKey({ mode, spaceName });
    pendingRequests.set(key, { spaceName, handle, mode, refreshProvider });
    return { mode, spaceName };
  };

  const clearForSpace = (spaceName: string) => {
    for (const [key, request] of pendingRequests.entries()) {
      if (request.spaceName === spaceName) {
        pendingRequests.delete(key);
      }
    }
  };

  const getRequest = (
    key: FileSystemAccessRequestKey,
  ): Promise<FileSystemAccessRequestKey | undefined> => {
    const request = pendingRequests.get(
      makeRequestKey({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );
    return Promise.resolve(
      request ? { operation: key.operation, spaceName: request.spaceName } : undefined,
    );
  };

  const prepareHandle = (
    key: FileSystemAccessRequestKey,
  ): Promise<(FileSystemAccessRequestKey & { handle: FileSystemDirectoryHandle }) | undefined> => {
    const request = pendingRequests.get(
      makeRequestKey({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );
    return Promise.resolve(
      request
        ? { handle: request.handle, operation: key.operation, spaceName: request.spaceName }
        : undefined,
    );
  };

  const resolve = async ({
    operation,
    permissionState,
    spaceName,
  }: FileSystemAccessRequestKey & {
    permissionState: PermissionState;
  }): Promise<ResolveAccessRequestResult> => {
    const mode = operationToMode(operation);
    const requestKey = { mode, spaceName } satisfies DeviceDirectoryAccessRequestKey;
    const request = pendingRequests.get(makeRequestKey(requestKey));

    if (!request) {
      return { status: 'missing' };
    }

    if (permissionState !== 'granted') {
      return { status: permissionState === 'denied' ? 'denied' : 'cancelled' };
    }

    deleteRequest(requestKey);
    await request.refreshProvider();

    if (operation !== 'write') {
      return { status: 'granted' };
    }

    const mountPath = PathUtils.join(deviceFilesPath, spaceName);

    for (const handler of writeRecoveryHandlers) {
      // eslint-disable-next-line no-await-in-loop -- recovery handlers may depend on prior flush attempts
      const result = await handler({ mountPath, operation: 'write', spaceName });

      if (result.status === 'stillBlocked') {
        return { status: 'grantedWithReplayFailures' };
      }

      if (result.status === 'failed') {
        return { status: 'grantedWithStorageFailures' };
      }
    }

    return { status: 'granted' };
  };

  const cancel = (key: FileSystemAccessRequestKey): Promise<boolean> =>
    Promise.resolve(
      deleteRequest({ mode: operationToMode(key.operation), spaceName: key.spaceName }),
    );

  const registerWriteRecoveryHandler = (handler: WriteAccessRecoveryHandler) => {
    writeRecoveryHandlers.add(handler);
    return () => {
      writeRecoveryHandlers.delete(handler);
    };
  };

  return {
    upsertRequest,
    clearForSpace,
    getRequest,
    prepareHandle,
    resolve,
    cancel,
    registerWriteRecoveryHandler,
  };
};
