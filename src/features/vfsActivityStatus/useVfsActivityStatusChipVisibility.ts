import { computed, type ComputedRef } from 'vue';
import { useVfsActivity } from '@entity/vfsActivity';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';

/** Visible chip statuses. Idle is hidden by parent composition. */
export type VisibleVfsActivityStatus = Exclude<VfsActivityState['status'], 'idle'>;

/**
 * Maps the current VFS activity state to the compact status-chip visibility contract.
 * @param state - Current VFS activity state from the entity read model.
 * @param options - Derived error visibility flags owned by the same read model.
 * @returns The visible chip status or `undefined` when the parent should not mount the chip.
 */
export const getVfsActivityStatusChipVisibility = (
  state: VfsActivityState,
  options: {
    /** Whether the current error still needs user attention. */
    hasUnacknowledgedError: boolean;
  },
): VisibleVfsActivityStatus | undefined => {
  if (state.status === 'active') {
    return 'active';
  }

  if (state.status === 'error' && options.hasUnacknowledgedError) {
    return 'error';
  }

  return undefined;
};

/**
 * Exposes whether the VFS activity chip should be mounted by parent composition.
 * @returns A computed visible status for the feature chip, or `undefined` while idle/saved.
 */
export const useVfsActivityStatusChipVisibility = (): {
  /** Visible chip status for parent-controlled mounting. */
  visibleStatus: ComputedRef<VisibleVfsActivityStatus | undefined>;
} => {
  const { hasUnacknowledgedError, state } = useVfsActivity();

  const visibleStatus = computed(() =>
    getVfsActivityStatusChipVisibility(state.value, {
      hasUnacknowledgedError: hasUnacknowledgedError.value,
    }),
  );

  return {
    visibleStatus,
  };
};
