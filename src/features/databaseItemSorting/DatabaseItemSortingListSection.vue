<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { computed, nextTick, ref, toRefs, useTemplateRef, watch } from 'vue';
import { useDatabaseViewSorting } from './useDatabaseItemSorting';
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument';
import { MDSymbol } from '@shared/ui/Icon';
import { useSortable } from '@shared/lib/sortable';
import type { MaybeElement } from '@vueuse/core';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDMenu } from '@shared/ui/Menu';
import { difference } from 'es-toolkit';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId: DatabaseViewId;
}>();

const { docHandle, viewId } = toRefs(props);

defineSlots<{
  trailingIcon: (p: {
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
  }) => unknown;
}>();

const databaseProperties = useDatabasePropertiesMap(docHandle);

const container = useTemplateRef<MaybeElement>('container');

const sortListValue = ref<
  {
    headline: string;
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
    supportingText: string;
  }[]
>([]);

const databaseViewSorting = useDatabaseViewSorting(docHandle, viewId);

const changeSortListValueWatchHandle = watch(
  sortListValue,
  (sortListValue) => {
    fillingSortListValueWatchHandle.pause();
    const deleteSortingId = new Set(databaseViewSorting.keys);

    sortListValue.forEach((sortValue, priority) => {
      const { propertyId: propertyId, direction } = sortValue;

      deleteSortingId.delete(propertyId);

      const sortDescription = { direction, priority };

      if (!databaseViewSorting.has(propertyId)) {
        void databaseViewSorting.addSorting(propertyId, sortDescription);
      } else {
        void databaseViewSorting.put(propertyId, sortDescription);
      }
    });

    deleteSortingId.forEach((propertyId) => {
      void databaseViewSorting.remove(propertyId);
    });
    void nextTick(fillingSortListValueWatchHandle.resume);
  },
  { deep: true },
);

const fillingSortListValueWatchHandle = watch(
  () => databaseViewSorting.sortingList,
  (sortingList) => {
    changeSortListValueWatchHandle.pause();
    sortListValue.value.length = 0;
    sortingList?.forEach(([propertyId, { direction }]) => {
      sortListValue.value.push({
        headline:
          databaseProperties.get(propertyId)?.name ?? 'unknown property',
        propertyId,
        direction,
        supportingText:
          direction === SORT_DIRECTION.descending ? 'descending' : 'ascending',
      });
    });
    void nextTick(changeSortListValueWatchHandle.resume);
  },
  { deep: true, immediate: true },
);

const { draggableItem } = useSortable(container, sortListValue);

const isShowAddSortingMenu = ref(false);

const onClickAddSorting = () => {
  isShowAddSortingMenu.value = true;
};

const addSortingBtn = useTemplateRef<MaybeElement>('addSortingBtn');

const propertyWithoutSorting = computed(() =>
  difference(databaseProperties.keys ?? [], databaseViewSorting.keys ?? []),
);

const sortingOptions = computed(() =>
  propertyWithoutSorting.value.map((propertyId) => ({
    label: databaseProperties.get(propertyId)?.name ?? 'unknown property',
    key: propertyId,
    direction: SORT_DIRECTION.ascending,
  })),
);

const onClickAddSortingMenu = async ({ key }: { key: DatabasePropertyId }) => {
  await databaseViewSorting.addSorting(key);
  isShowAddSortingMenu.value = false;
};

const onClickSortingItem = async (
  propertyId: DatabasePropertyId,
  direction: SORT_DIRECTION,
) => {
  await databaseViewSorting.put(propertyId, {
    direction:
      direction === SORT_DIRECTION.ascending
        ? SORT_DIRECTION.descending
        : SORT_DIRECTION.ascending,
  });
};

const onClickRemoveItem = async (propertyId: DatabasePropertyId) => {
  await databaseViewSorting.remove(propertyId);
};
</script>

<template>
  <section class="db-item-sorting-list-section">
    <MDListContainer v-if="sortListValue.length" ref="container">
      <MDListItem
        is="button"
        v-for="item in sortListValue"
        :key="item.propertyId"
        :headline="item.headline"
        draggable
        :supporting-text="item.supportingText"
        :class="{
          'md-state_drag': draggableItem === item,
        }"
        @click="onClickSortingItem(item.propertyId, item.direction)"
      >
        <template #leadingIcon>
          <MDSymbol
            name="sort"
            :class="{
              flip: item.direction === SORT_DIRECTION.ascending,
            }"
          />
        </template>

        <template #trailingIcon>
          <MDIconButton
            color="standard"
            tooltip="remove"
            md-symbol-name="delete"
            @click="onClickRemoveItem(item.propertyId)"
          />
        </template>
      </MDListItem>
    </MDListContainer>

    <div class="db-item-sorting-list-section__actions">
      <MDButton
        ref="addSortingBtn"
        label="add sorting"
        @click="onClickAddSorting"
      >
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDButton>
    </div>

    <MDMenu
      v-model:show="isShowAddSortingMenu"
      :btns="sortingOptions"
      :target="addSortingBtn"
      @interaction-outside="isShowAddSortingMenu = false"
      @click="onClickAddSortingMenu"
    />
  </section>
</template>

<style lang="css" scoped>
.db-item-sorting-list-section {
  &__actions {
    &:not(:first-child) {
      margin-top: 2step;
    }
  }
}

.flip {
  transform: rotateX(180deg);
}
</style>
