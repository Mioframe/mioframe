<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { DatabaseViewCreateDialog } from '@feature/databaseViewAdd';
import { useDatabaseDocument, type ViewId } from '@shared/lib/databaseDocument';
import { VIEW_LAYOUT } from '@shared/lib/databaseDocument/view/general';
import { useReduce } from '@shared/lib/useReduce';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { shallowRef, toRef } from 'vue';

/**
 * Виджет настроек отображения данных.
 * Пресеты настроек, фильтры, сортировки, шаблоны отображения и т.д.
 */

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const docHandleRef = toRef(() => docHandle);

const { views, addView } = useDatabaseDocument(docHandleRef);

const viewsRef = toRef(() => views.value);

const selectedViewId = defineModel<ViewId>('selectedViewId');

const viewButtons = useReduce(
  viewsRef,
  (acc, [viewId, { name }]) => {
    acc.push({
      label: name,
      viewId,
    });
  },
  <{ label: string; viewId: ViewId }[]>[],
);

const onClickViewChip = (viewId: ViewId) => {
  selectedViewId.value = viewId;
};

const isShowAddView = shallowRef(false);

const onClickAddView = () => {
  isShowAddView.value = true;
};

const isShowSettingUpViews = shallowRef(false);

const onClickSettingUpViews = () => {
  isShowSettingUpViews.value = true;
};

const onAddView = async ({ name }: { name: string }) => {
  await addView({
    name,
    layout: VIEW_LAYOUT.TABLE,
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
    <!-- панель настройки шаблона отображения -->

    <DatabaseViewCreateDialog
      v-if="isShowAddView"
      @submit="onAddView"
      @cancel="onCancelAddView"
    />

    <!-- // todo: добавить окно настройки списка пресетов -->
  </div>
</template>

<style lang="css" scoped>
.preset-section {
  display: flex;
  overflow-x: auto;
  gap: 8px;
}
</style>
