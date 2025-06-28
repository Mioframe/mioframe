<script setup lang="ts">
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import {
  useDatabaseDocument,
  useDatabaseView,
  useDatabaseViewsMap,
} from '@shared/lib/databaseDocument';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/state/v2';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument/state/v2/view/general';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { computed, shallowRef, toRef, watchEffect } from 'vue';
import DatabaseViewSettingDialog from './DatabaseViewsSettingDialog.vue';
import { DatabaseItemSortingSection } from '@feature/databaseItemSorting';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDIconButton } from '@shared/ui/Button';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { toRefs } from '@vueuse/core';
import { throttle } from 'es-toolkit';

/**
 * Виджет настроек отображения данных.
 * Пресеты настроек, фильтры, сортировки, шаблоны отображения и т.д.
 */

const { docHandle } = defineProps<{
  docHandle: AMDocHandle;
}>();

const docHandleRef = toRef(() => docHandle);

const databaseDocument = useDatabaseDocument(docHandleRef);

const { properties } = toRefs(databaseDocument);

const databaseViewsMap = useDatabaseViewsMap(docHandleRef);

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

const selectedView = useDatabaseView(docHandleRef, selectedViewId);

const selectedSortMap = computed(() => selectedView.view?.sorting);

watchEffect(
  throttle(() => {
    if (!selectedView.view?.sorting) {
      void selectedView.update({});
    }
  }, 1e3),
);

const viewsList = computed(() => databaseViewsMap.list);

const viewButtons = useReduceIterable(
  viewsList,
  (acc, [viewId, { name }]) => {
    acc.push({
      label: name,
      viewId,
    });
  },
  <{ label: string; viewId: DatabaseViewId }[]>[],
);

const onClickViewChip = (viewId: DatabaseViewId) => {
  selectedViewId.value = viewId;
};

const isShowAddView = shallowRef(false);

const isShowSettingUpViews = shallowRef(false);

const onClickSettingUpViews = () => {
  isShowSettingUpViews.value = true;
};

const onAddView = async ({ name }: { name: string }) => {
  const order = databaseViewsMap.size ?? 0;
  await databaseViewsMap.create({
    name,
    layout: DB_VIEW_LAYOUT.TABLE,
    order,
  });

  isShowAddView.value = false;
};

const onCancelAddView = () => {
  isShowAddView.value = false;
};
</script>

<template>
  <div class="database-view-preset-settings-widget">
    <div class="preset-section">
      <!-- панель пресетов -->
      <MDChip
        v-for="{ viewId, label } in viewButtons"
        :key="viewId"
        :label
        :selected="selectedViewId === viewId"
        type="filter"
        @click="onClickViewChip(viewId)"
      />

      <MDChip
        label="Setting up views"
        type="assist"
        @click="onClickSettingUpViews"
      >
        <template #leadingIcon>
          <MDSymbol name="settings" />
        </template>
      </MDChip>
    </div>
    <!-- панель фильтрации -->

    <!-- панель сортировки -->
    <div class="database-view-preset-settings-widget__subtitle md-margin-top-2">
      <span :class="MD_SYS_TYPESCALE.title.small">Sorting settings</span>

      <MDIconButton
        tooltip="Managing content sorting"
        md-symbol-name="info"
        class="md-margin-left-2"
        show-tooltip-on-click
      >
        <template #richTooltipContent>
          Drag and drop items to change sort priority.<br />
          Click on an item to change sort direction.
        </template>
      </MDIconButton>
    </div>

    <DatabaseItemSortingSection
      v-if="properties && selectedSortMap"
      v-model:sort-map="selectedSortMap"
      :property-map="properties"
    />
    <!-- / панель сортировки -->

    <!-- панель настройки шаблона отображения -->

    <DatabaseViewCreateDialog
      v-if="isShowAddView"
      @submit="onAddView"
      @cancel="onCancelAddView"
    />

    <DatabaseViewSettingDialog
      v-if="isShowSettingUpViews"
      :doc-handle="docHandle"
      @cancel="isShowSettingUpViews = false"
      @completed="isShowSettingUpViews = false"
    />
  </div>
</template>

<style lang="css" scoped>
.preset-section {
  display: flex;
  overflow-x: auto;
  gap: 8px;
}

.database-view-preset-settings-widget {
  &__subtitle {
    display: flex;
    align-items: center;
  }
}
</style>
