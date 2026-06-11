import { useFSNodeStat } from '@entity/fsEntry';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { computed, type Ref } from 'vue';
import { useFSEntryManageActions } from './useFSEntryManageActions';

/**
 * Derives whether any manage actions are available for a given FS entry.
 * Use this in parent composition to decide whether to render `FSEntryManageMenuButton`
 * or `RepositoryExplorerEntryManageButton`.
 * @param path - Reactive absolute path of the FS entry.
 * @param entryType - Reactive node type (file or directory).
 * @param showDocumentActions - Whether document-specific actions should be included.
 * @returns `hasActions` computed boolean.
 */
export const useEntryManageAvailability = (
  path: Ref<string>,
  entryType: Ref<FSNodeType>,
  showDocumentActions: Ref<boolean | undefined>,
) => {
  const { data: fsEntryStat } = useFSNodeStat(path);
  const canEditChildren = computed(() => fsEntryStat.value?.capabilities?.canEditChildren);
  const canChangePath = computed(() => fsEntryStat.value?.capabilities?.canChangePath);
  const canDelete = computed(() => fsEntryStat.value?.capabilities?.canDelete);

  const { hasActions } = useFSEntryManageActions({
    entryType,
    canEditChildren,
    canChangePath,
    canDelete,
    showDocumentActions,
  });

  return { hasActions };
};
