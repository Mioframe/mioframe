import { useFileSystemService } from './useFileSystemService';
import { createReleaseTestDelayedWriteProvider } from './releaseTestDelayedWriteProvider';

/**
 * Private worker-side release-test service id — entirely separate from the production
 * `mainBackgroundService`/`fileSystem` RPC surface, so no release-test field is ever present on
 * it. Registered only when `__RELEASE_TEST_HOOKS__` is true (see `serviceWorker.ts`).
 */
export const releaseTestFileSystemServiceId = 'releaseTestFileSystemService';

const RELEASE_TEST_PENDING_MOUNT_PATH = '/__release-test-pending__';
const RELEASE_TEST_PENDING_WRITE_PATH = `${RELEASE_TEST_PENDING_MOUNT_PATH}/pending.txt`;

/**
 * Set up the release-only worker-side pending-write test service.
 *
 * Mounts one delayed-write provider into the same singleton VFS the production file-system
 * service uses (`useFileSystemService` is a global-state singleton per worker, so this reuses the
 * exact instance production code observes), and exposes start/finish for one real, tracked VFS
 * mutation driven through the ordinary `writeFile` path — never a VFS-specific test method.
 * @returns The release-only pending-write RPC surface.
 */
export const setupReleaseTestFileSystemService = () => {
  const { vfs } = useFileSystemService();
  const { provider, releasePendingWrite } = createReleaseTestDelayedWriteProvider();
  vfs.mount(RELEASE_TEST_PENDING_MOUNT_PATH, provider);

  return {
    /**
     * Start one real, tracked, indefinitely-pending `writeFile` mutation, observable through the
     * existing production `useVfsActivity`/`vfsActivity` activity tracker exactly like a genuine
     * user write.
     */
    startReleaseTestPendingWrite: (): void => {
      void vfs.writeFile(RELEASE_TEST_PENDING_WRITE_PATH, 'pending');
    },
    /** Resolve the pending mutation started by {@link startReleaseTestPendingWrite}. */
    finishReleaseTestPendingWrite: (): void => {
      releasePendingWrite();
    },
  };
};
