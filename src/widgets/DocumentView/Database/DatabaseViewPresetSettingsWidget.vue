<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/state/v2';
import { DB_VIEW_LAYOUT } from '@shared/lib/databaseDocument/state/v2/view/general';
import { useReduceIterable } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { computed, shallowRef, toRef } from 'vue';
import DatabaseViewSettingDialog from './DatabaseViewsSettingDialog.vue';
import { DatabaseItemSortingSection } from '@feature/databaseItemSorting';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDIconButton } from '@shared/ui/Button';
import type { UnknownRecord } from 'type-fest';

/**
 * Виджет настроек отображения данных.
 * Пресеты настроек, фильтры, сортировки, шаблоны отображения и т.д.
 */

const { docHandle } = defineProps<{
  docHandle: DocHandle<UnknownRecord>;
}>();

const docHandleRef = toRef(() => docHandle);

const {
  view: { state: views, add: addView, list: viewsList },
  properties,
} = useDatabaseDocument(docHandleRef);

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

const selectedView = computed(() =>
  selectedViewId.value ? views.value?.[selectedViewId.value] : undefined,
);

const selectedSortMap = computed(() => selectedView.value?.sorting);

// watchEffect(() => {
//   if (selectedView.value && !('sorting' in selectedView.value)) {
//     selectedView.value['sorting'] = {};
//   }
// });

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
  const order = views.value ? Object.keys(views.value).length : 0;
  await addView({
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

      <!-- TODO: добавить RichTooltip с объяснением настройки -->
      <MDIconButton disabled tooltip="description" md-symbol-name="info" />
    </div>

    <DatabaseItemSortingSection
      v-if="properties && selectedSortMap"
      v-model:sort-map="selectedSortMap"
      :property-map="properties"
    />

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
