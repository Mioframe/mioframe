import { useObservable } from '@shared/lib/useObservable';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { useMainServiceClient } from '@shared/service';
import { computed } from 'vue';

const DEFAULT_STATE: VfsActivityState = {
  status: 'idle',
  activeCount: 0,
};

/**
 * Reads VFS mutation activity from the main file-system service and derives UI-facing display state.
 * @returns Reactive VFS activity state plus derived UI flags.
 */
export const useVfsActivity = () => {
  const { fileSystem } = useMainServiceClient();
  const { vfsActivity } = fileSystem;

  const { data, error, isLoading } = useObservable(vfsActivity);

  const state = computed(() => data.value ?? DEFAULT_STATE);
  const isActive = computed(() => state.value.status === 'active');
  const hasUnacknowledgedError = computed(
    () => !!state.value.lastError && !state.value.lastError.acknowledged,
  );

  return {
    state,
    error,
    hasUnacknowledgedError,
    isActive,
    isLoading,
    // Release-only browser test seam (see `MainApp.vue`): never present outside a release-test
    // build, and application code never reads it.
    ...(__RELEASE_TEST_HOOKS__ && {
      startReleaseTestPendingOperation: () => fileSystem.startReleaseTestPendingOperation?.(),
      finishReleaseTestPendingOperation: (token: string) =>
        fileSystem.finishReleaseTestPendingOperation?.(token),
    }),
  };
};
