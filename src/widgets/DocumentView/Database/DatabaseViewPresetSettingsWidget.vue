<script setup lang="ts">
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { useDatabaseViewsMap } from '@shared/lib/databaseDocument';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { computed, ref, shallowRef, toRefs, watch } from 'vue';
import { DatabaseItemSortingSection } from '@feature/databaseItemSorting';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDIconButton } from '@shared/ui/Button';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { DatabaseViewMapEdit } from '@feature/databaseViewMapEdit';
import { DatabaseViewRenameDialog } from '@feature/databaseViewRename';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { useDialog } from '@shared/ui/Dialog';

/**
 * Виджет настроек отображения данных.
 * Пресеты настроек, фильтры, сортировки, шаблоны отображения и т.д.
 */

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const databaseViewsMap = useDatabaseViewsMap(docHandle);

const firstViewId = computed(() => databaseViewsMap.list?.at(0)?.[0]);

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

watch(
  firstViewId,
  (firstViewId) => {
    selectedViewId.value = firstViewId;
  },
  { immediate: true },
);

const onClickViewChip = (viewId: DatabaseViewId) => {
  selectedViewId.value = viewId;
};

const isShowAddView = shallowRef(false);

const renameViewId = ref<DatabaseViewId>();

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

const { confirm } = useDialog();

const openRenameDialog = (viewId: DatabaseViewId) => {
  renameViewId.value = viewId;
};

const closeRenameDialog = () => {
  renameViewId.value = undefined;
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
        await databaseViewsMap.remove(viewId);
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

/* TODO: разделить на компоненты:
  - настройка View - компонуемый виджет с множестввом форм
  - настройка фильтрации
  - ... уникальные настройки view
*/
</script>

<template>
  <div class="database-view-preset-settings-widget">
    <div class="database-view-preset-settings-widget__subtitle md-margin-top-2">
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

    <div class="preset-section">
      <DatabaseViewMapEdit
        :doc-handle="docHandle"
        :selected-view="selectedViewId"
        @click-view="onClickViewChip"
      >
        <template #trailingIcon="{ viewId }">
          <MDContextMenuButton
            :btns="viewContextMenu"
            tooltip="settings view"
            @click="onClickViewContextMenu(viewId, $event)"
          />
        </template>
      </DatabaseViewMapEdit>

      <MDChip label="add view" type="assist" @click="isShowAddView = true">
        <template #leadingIcon>
          <MDSymbol name="add" />
        </template>
      </MDChip>
    </div>
    <!-- TODO: панель фильтрации -->

    <DatabaseItemSortingSection
      v-if="selectedViewId"
      class="md-margin-top-4"
      :doc-handle="docHandle"
      :view-id="selectedViewId"
    />

    <!-- панель настройки шаблона отображения -->

    <DatabaseViewCreateDialog
      v-if="isShowAddView"
      v-model:show="isShowAddView"
      :doc-handle="docHandle"
      @created="isShowAddView = false"
      @cancel="isShowAddView = false"
    />

    <DatabaseViewRenameDialog
      v-if="renameViewId"
      :show="!!renameViewId"
      :doc-handle="docHandle"
      :view-id="renameViewId"
      @update:show="(show) => show || closeRenameDialog()"
      @cancel="renameViewId = undefined"
      @completed="renameViewId = undefined"
    />
  </div>
</template>

<style lang="css" scoped>
.preset-section {
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 2step;
  scrollbar-width: none;
}

.database-view-preset-settings-widget {
  &__subtitle {
    display: flex;
    align-items: center;
  }
}
</style>
