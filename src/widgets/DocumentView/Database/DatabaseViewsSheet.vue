<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { DatabaseViewListEdit } from '@feature/databaseViewMapEdit';
import { DatabaseViewRenameDialog } from '@feature/databaseViewRename';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDIconButton } from '@shared/ui/Button';
import MDButton from '@shared/ui/Button/MDButton.vue';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { useDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { ref, shallowRef, toRefs } from 'vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { documentId, path } = toRefs(props);

const showModel = defineModel<boolean>('show', { required: true });

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

const { confirm } = useDialog();

const { remove: removeView } = useDatabaseViews(path, documentId);

const onChangeSelectedViewId = (viewId: DatabaseViewId, checked?: boolean) => {
  if (checked) {
    selectedViewId.value = viewId;
  }
};

enum VIEW_CONTEXT_ACTION {
  remove,
  rename,
}

const viewContextMenu = defineMenuButtonList([
  {
    symbolName: 'edit',
    label: 'rename',
    key: VIEW_CONTEXT_ACTION.rename,
  },
  {
    symbolName: 'delete',
    label: 'remove',
    key: VIEW_CONTEXT_ACTION.remove,
  },
]);

const renameViewId = ref<DatabaseViewId>();

const openRenameDialog = (viewId: DatabaseViewId) => {
  renameViewId.value = viewId;
};

const onClickViewContextMenu = async (
  viewId: DatabaseViewId,
  { key: action }: { key: VIEW_CONTEXT_ACTION },
) => {
  switch (action) {
    case VIEW_CONTEXT_ACTION.remove: {
      if (
        await confirm(
          'Remove view?',
          'Are you sure you want to delete View presets?',
          'Remove',
          'delete',
        )
      ) {
        await removeView(viewId);
      }

      break;
    }

    case VIEW_CONTEXT_ACTION.rename: {
      openRenameDialog(viewId);
      break;
    }

    default:
      break;
  }
};

const isShowAddView = shallowRef(false);

const closeRenameDialog = () => {
  renameViewId.value = undefined;
};
</script>

<template>
  <MDBottomSheet v-model:show="showModel" label="Database Views Sheet">
    <MDBottomSheetSection class="db-views-sheet__section">
      <div class="db-views-sheet__header">
        <span :class="MD_SYS_TYPESCALE.title.small">View presets</span>

        <MDIconButton
          tooltip="Managing content sorting"
          md-symbol-name="info"
          class="md-margin-left-2"
          show-tooltip-on-click
        >
          <template #richTooltipContent>
            Pre-configured data display sets
          </template>
        </MDIconButton>
      </div>

      <div class="db-views-sheet__body">
        <DatabaseViewListEdit
          class="db-views-sheet__list"
          :directory-path="path"
          :document-id="documentId"
          @click-view="onChangeSelectedViewId($event, true)"
        >
          <template #leadingIcon="{ viewId }">
            <MDCheckbox
              :model-value="viewId === selectedViewId"
              @update:model-value="onChangeSelectedViewId(viewId, $event)"
            />
          </template>

          <template #trailingIcon="{ viewId }">
            <MDContextMenuButton
              :btns="viewContextMenu"
              tooltip="settings view"
              @click="onClickViewContextMenu(viewId, $event)"
            />
          </template>
        </DatabaseViewListEdit>

        <div class="db-views-sheet__actions">
          <MDButton label="add view" @click="isShowAddView = true">
            <template #icon>
              <MDSymbol name="add" />
            </template>
          </MDButton>
        </div>
      </div>
    </MDBottomSheetSection>

    <DatabaseViewCreateDialog
      v-if="isShowAddView"
      v-model:show="isShowAddView"
      :directory-path="path"
      :document-id="documentId"
      @created="isShowAddView = false"
      @cancel="isShowAddView = false"
    />

    <DatabaseViewRenameDialog
      v-if="renameViewId"
      :show="!!renameViewId"
      :directory-path="path"
      :document-id="documentId"
      :view-id="renameViewId"
      @update:show="(show) => show || closeRenameDialog()"
      @cancel="renameViewId = undefined"
      @completed="renameViewId = undefined"
    />
  </MDBottomSheet>
</template>

<style lang="css" scoped>
.db-views-sheet {
  &__section {
    padding: 0 4step 4step;
  }

  &__header {
    display: flex;
    align-items: center;
  }

  &__body {
    margin-top: 2step;
  }

  &__actions {
    margin-top: 2step;
  }
}
</style>
