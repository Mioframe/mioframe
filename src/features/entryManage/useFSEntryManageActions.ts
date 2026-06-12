import { type Ref, computed } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { defineMenuButtonList, type BaseMenuButton } from '@shared/ui/Menu';

/** Non-empty menu-button list required by entry-manage action controls. */
export type NonEmptyMenuButtonList<T extends BaseMenuButton = BaseMenuButton> = [T, ...T[]];

/** Reactive capability inputs that determine which FS entry actions are available. */
type FSEntryManageActionsOptions = {
  /** Node type (file or directory). */
  entryType: Ref<FSNodeType>;
  /** Whether children of this entry can be created or removed. */
  canEditChildren: Ref<boolean | undefined>;
  /** Whether this entry can be renamed or moved. */
  canChangePath: Ref<boolean | undefined>;
  /** Whether this entry can be deleted. */
  canDelete: Ref<boolean | undefined>;
  /** Whether document-specific actions (create document, import) should be included. */
  showDocumentActions: Ref<boolean | undefined>;
};

/**
 * Derives the available action button list and a `hasActions` flag from FS entry capabilities.
 * Single source of truth for action derivation used by `FSEntryManageMenuButton` and its parent.
 * @param options - Reactive capability refs for the FS entry.
 * @returns `actionButtons`, `hasActions`, and a nullable non-empty action list for guarded parents.
 */
export const useFSEntryManageActions = (options: FSEntryManageActionsOptions) => {
  const actionButtons = computed(() => {
    const { entryType, canEditChildren, canChangePath, canDelete, showDocumentActions } = options;
    const isDirectory = entryType.value === FSNodeType.Directory;
    const buttons: Array<{ key: string; label: string; symbolName: string }> = [];

    if (isDirectory && canEditChildren.value !== false && showDocumentActions.value === true) {
      buttons.push({
        key: 'createDirectory',
        label: 'Create directory',
        symbolName: 'create_new_folder',
      });
      buttons.push({
        key: 'createDocument',
        label: 'Create document',
        symbolName: 'edit_document',
      });
    } else if (isDirectory && canEditChildren.value !== false) {
      buttons.push({
        key: 'createDirectory',
        label: 'Create directory',
        symbolName: 'create_new_folder',
      });
    }

    if (canChangePath.value !== false) {
      buttons.push({ key: 'rename', label: 'Rename', symbolName: 'edit' });
    }

    if (isDirectory && canEditChildren.value !== false && showDocumentActions.value === true) {
      buttons.push({ key: 'importJson', label: 'Import JSON', symbolName: 'file_copy' });
    }

    if (canDelete.value !== false) {
      buttons.push({ key: 'remove', label: 'Remove', symbolName: 'delete' });
    }

    return defineMenuButtonList(buttons);
  });

  const hasActions = computed(() => actionButtons.value.length > 0);
  const nonEmptyActionButtons = computed<NonEmptyMenuButtonList | null>(() => {
    const [firstButton, ...remainingButtons] = actionButtons.value;

    if (firstButton === undefined) {
      return null;
    }

    return [firstButton, ...remainingButtons];
  });

  return { actionButtons, hasActions, nonEmptyActionButtons };
};
