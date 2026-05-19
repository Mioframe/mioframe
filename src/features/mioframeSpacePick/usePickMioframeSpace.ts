import { computed } from 'vue';
import { useCreateMioframeSpace } from './useCreateMioframeSpace';
import { useOpenMioframeSpace } from './useOpenMioframeSpace';

export type {
  CreateDialogState,
  CreateFlowState,
  CreateSpaceNameSubmitResult,
} from './useCreateMioframeSpace';

/**
 * Compatibility facade for callers that still need both Mioframe create and open flows.
 * Prefer using useCreateMioframeSpace or useOpenMioframeSpace from feature UI components.
 */
export const usePickMioframeSpace = () => {
  const create = useCreateMioframeSpace();
  const open = useOpenMioframeSpace();

  return {
    isSupported: computed(() => create.isSupported.value && open.isSupported.value),
    loading: computed(() => create.loading.value || open.loading.value),
    hasActiveDialog: create.hasActiveDialog,
    createDialogState: create.createDialogState,
    createFlowState: create.createFlowState,
    createSpace: create.createSpace,
    submitCreateSpaceName: create.submitCreateSpaceName,
    cancelCreateSpace: create.cancelCreateSpace,
    openExistingSpaceFromConflict: create.openExistingSpaceFromConflict,
    openSpace: open.openSpace,
  };
};
