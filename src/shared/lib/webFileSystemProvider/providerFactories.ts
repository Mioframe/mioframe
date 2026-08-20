import type { IFileSystemProvider } from '../virtualFileSystem';
import {
  WebFileSystemProvider,
  type WebFileSystemDiagnosticStep,
  type WebFileSystemProviderAccessRequiredContext,
  type WebFileSystemProviderOptions,
} from './WebFileSystemProvider';
import type { WebFileSystemAccessRequiredDetails } from './WebFileSystemAccessRequiredError';
import type { WebFileSystemUnavailableRootDetails } from './WebFileSystemUnavailableRootError';

/** Provider instance with an internal access-refresh hook owned below the service boundary. */
export interface RefreshableWebFileSystemProvider extends IFileSystemProvider {
  /** Emits a provider-owned refresh event after access state changes for the mounted root. */
  notifyAccessChanged(): Promise<void>;
}

type AccessRequiredHandler = (
  context: WebFileSystemProviderAccessRequiredContext,
) => WebFileSystemAccessRequiredDetails | undefined;
type UnavailableRootHandler = () => WebFileSystemUnavailableRootDetails | undefined;
type DiagnosticStepHandler = (event: WebFileSystemDiagnosticStep) => void;

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
 * @param onDiagnosticStep - Optional safe diagnostic milestone callback.
 * @param onUnavailableRoot - Optional service-owned callback for a granted-but-unreadable root.
 * @returns Refreshable provider instance for the selected directory.
 */
export const createUserSelectedDirectoryProvider = (
  rootHandle: FileSystemDirectoryHandle,
  onAccessRequired: AccessRequiredHandler,
  onDiagnosticStep?: DiagnosticStepHandler,
  onUnavailableRoot?: UnavailableRootHandler,
): RefreshableWebFileSystemProvider =>
  createProvider(rootHandle, {
    permissionPolicy: 'userSelectedDirectory',
    onAccessRequired,
    ...(onDiagnosticStep !== undefined ? { onDiagnosticStep } : {}),
    ...(onUnavailableRoot !== undefined ? { onUnavailableRoot } : {}),
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
  onDiagnosticStep,
  onUnavailableRoot,
  rootHandle,
}: {
  kind: MountedWebFileSystemKind;
  onAccessRequired?: AccessRequiredHandler | undefined;
  onDiagnosticStep?: DiagnosticStepHandler | undefined;
  onUnavailableRoot?: UnavailableRootHandler | undefined;
  rootHandle: FileSystemDirectoryHandle;
}): RefreshableWebFileSystemProvider =>
  kind === 'localDirectory' && onAccessRequired
    ? createUserSelectedDirectoryProvider(
        rootHandle,
        onAccessRequired,
        onDiagnosticStep,
        onUnavailableRoot,
      )
    : kind === 'localDirectory'
      ? createProvider(rootHandle, {
          permissionPolicy: 'userSelectedDirectory',
          ...(onDiagnosticStep !== undefined ? { onDiagnosticStep } : {}),
          ...(onUnavailableRoot !== undefined ? { onUnavailableRoot } : {}),
        })
      : createOriginPrivateStorageProvider(rootHandle);
