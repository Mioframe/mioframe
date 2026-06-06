import type { IFileSystemProvider } from '../virtualFileSystem';
import {
  WebFileSystemProvider,
  type WebFileSystemProviderAccessRequiredContext,
  type WebFileSystemProviderOptions,
  type WebFileSystemWriteRetryEvent,
} from './WebFileSystemProvider';
import type { WebFileSystemAccessRequiredDetails } from './WebFileSystemAccessRequiredError';

/** Provider instance with an internal access-refresh hook owned below the service boundary. */
export interface RefreshableWebFileSystemProvider extends IFileSystemProvider {
  /** Emits a provider-owned refresh event after access state changes for the mounted root. */
  notifyAccessChanged(): Promise<void>;
}

type AccessRequiredHandler = (
  context: WebFileSystemProviderAccessRequiredContext,
) => WebFileSystemAccessRequiredDetails;
type WriteRetryHandler = (event: WebFileSystemWriteRetryEvent) => void;

/** Mounted provider kind used by the provider-boundary factory mapping. */
export type MountedWebFileSystemKind = 'browserStorage' | 'localDirectory';

const createProvider = (
  rootHandle: FileSystemDirectoryHandle,
  options: WebFileSystemProviderOptions,
): RefreshableWebFileSystemProvider => WebFileSystemProvider(rootHandle, options);

/**
 * Creates a provider for a user-selected directory that may need permission recovery.
 * @param rootHandle - Mounted root directory handle.
 * @param onAccessRequired - Service-owned callback that records a pending access request.
 * @param onWriteRetry - Optional safe retry milestone callback.
 * @returns Refreshable provider instance for the selected directory.
 */
export const createUserSelectedDirectoryProvider = (
  rootHandle: FileSystemDirectoryHandle,
  onAccessRequired: AccessRequiredHandler,
  onWriteRetry?: WriteRetryHandler,
): RefreshableWebFileSystemProvider =>
  createProvider(rootHandle, {
    permissionPolicy: 'userSelectedDirectory',
    onAccessRequired,
    ...(onWriteRetry !== undefined ? { onWriteRetry } : {}),
  });

/**
 * Creates a provider for browser-managed origin-private storage.
 * @param rootHandle - Mounted OPFS directory handle.
 * @returns Refreshable provider instance for browser storage.
 */
export const createOriginPrivateStorageProvider = (
  rootHandle: FileSystemDirectoryHandle,
): RefreshableWebFileSystemProvider =>
  createProvider(rootHandle, {
    permissionPolicy: 'originPrivateStorage',
  });

/**
 * Creates a mounted browser file-system provider using the provider-boundary kind mapping.
 * @param options - Mounted provider kind, root handle, and optional access-recovery callback.
 * @returns Refreshable provider instance for the mounted handle.
 */
export const createMountedWebFileSystemProvider = ({
  kind,
  onAccessRequired,
  onWriteRetry,
  rootHandle,
}: {
  kind: MountedWebFileSystemKind;
  onAccessRequired?: AccessRequiredHandler | undefined;
  onWriteRetry?: WriteRetryHandler | undefined;
  rootHandle: FileSystemDirectoryHandle;
}): RefreshableWebFileSystemProvider =>
  kind === 'localDirectory' && onAccessRequired
    ? createUserSelectedDirectoryProvider(rootHandle, onAccessRequired, onWriteRetry)
    : kind === 'localDirectory'
      ? createProvider(rootHandle, {
          permissionPolicy: 'userSelectedDirectory',
          ...(onWriteRetry !== undefined ? { onWriteRetry } : {}),
        })
      : createOriginPrivateStorageProvider(rootHandle);
