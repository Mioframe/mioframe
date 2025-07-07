<script setup lang="ts">
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { useDatabaseViewsMap } from '@shared/lib/databaseDocument';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { computed, shallowRef, toRefs, watch } from 'vue';
import DatabaseViewSettingDialog from './DatabaseViewsSettingDialog.vue';
import { DatabaseItemSortingSection } from '@feature/databaseItemSorting';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDIconButton } from '@shared/ui/Button';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { DatabaseViewChipsList } from '@entity/databaseView';

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

/* TODO: разделить на компоненты:
  - выбор View - список view с dnd сортиовкой
  - создание View - модельное окно с формой создания
  - настройка View - компонуемый виджет с множестввом форм
  - настройка сортировки
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
      <!-- панель пресетов -->
      <DatabaseViewChipsList
        :doc-handle="docHandle"
        type="filter"
        :selected-id="selectedViewId"
        @click="onClickViewChip"
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
    <DatabaseItemSortingSection
      v-if="selectedViewId"
      class="md-margin-top-4"
      :doc-handle="docHandle"
      :view-id="selectedViewId"
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
  --md-target-offset: 0px;
}

.database-view-preset-settings-widget {
  &__subtitle {
    display: flex;
    align-items: center;
  }
}
</style>
