<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/migrations/versions';
import { SORT_DIRECTION } from '@shared/lib/databaseDocument/migrations/versions';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { difference } from 'es-toolkit';
import {
  computed,
  nextTick,
  ref,
  toRefs,
  useTemplateRef,
  watch,
  watchEffect,
} from 'vue';
import { useDatabaseViewSorting } from './useDatabaseItemSorting';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { MDSelect } from '@shared/ui/Select';
import { useSortable } from '@shared/lib/sortable';

/**
 * Порядок сортировки по значениям свойств.
 * - на первом месте опциональна ручная сортировка (в будущем)
 */

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId: DatabaseViewId;
}>();

const { docHandle, viewId } = toRefs(props);

const databaseViewSorting = useDatabaseViewSorting(docHandle, viewId);

const databaseProperties = useDatabasePropertiesMap(docHandle);

const sortListState = ref<
  {
    propertyId: DatabasePropertyId;
    direction: SORT_DIRECTION;
    propertyName: string;
  }[]
>([]);

watchEffect(() => {
  sortListState.value.length = 0;

  databaseViewSorting.sortingList?.forEach(([propertyId, { direction }]) => {
    const property = databaseProperties.get(propertyId);

    if (property) {
      sortListState.value.push({
        propertyId,
        direction,
        propertyName: property.name,
      });
    }
  });
});

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

const sortListValue = ref<
  { label: string; key: DatabasePropertyId; direction: SORT_DIRECTION }[]
>([]);

const changeSortListValueWatchHandle = watch(
  sortListValue,
  (sortListValue) => {
    fillingSortListValueWatchHandle.pause();
    const deleteSortingId = new Set(databaseViewSorting.keys);

    sortListValue.forEach((sortValue, priority) => {
      const { key: propertyId, direction } = sortValue;

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
        label: databaseProperties.get(propertyId)?.name ?? 'unknown property',
        key: propertyId,
        direction,
      });
    });
    void nextTick(changeSortListValueWatchHandle.resume);
  },
  { deep: true, immediate: true },
);

const onClickRemoveOption = async (propertyId: DatabasePropertyId) => {
  await databaseViewSorting.remove(propertyId);
};

const onClickSelectedOption = async (propertyId: DatabasePropertyId) => {
  await databaseViewSorting.update(propertyId, (description) => {
    description.direction =
      description.direction === SORT_DIRECTION.ascending
        ? SORT_DIRECTION.descending
        : SORT_DIRECTION.ascending;
  });
};

const chipListEl = useTemplateRef('chipListEl');

const { draggableItem } = useSortable(chipListEl, sortListValue);
</script>

<template>
  <MDSelect
    v-model:model-value="sortListValue"
    class="database-item-sorting-section"
    label-text="Sorting"
    :options="sortingOptions"
    multiple
  >
    <template #valueContainer>
      <div ref="chipListEl" class="database-item-sorting-section__chip-list">
        <TransitionGroup name="dnd">
          <MDChip
            v-for="item in sortListValue"
            :key="item.key"
            type="input"
            :label="item.label"
            draggable
            :class="{ 'md-state_drag': draggableItem?.key === item.key }"
            @click-close="onClickRemoveOption(item.key)"
            @click="onClickSelectedOption(item.key)"
          >
            <template #leadingIcon>
              <MDSymbol
                name="sort"
                :class="{
                  flip: item.direction === SORT_DIRECTION.ascending,
                }"
              />
            </template>
          </MDChip>
        </TransitionGroup>
      </div>
    </template>
  </MDSelect>
</template>

<style lang="css" scoped>
.database-item-sorting-section {
  &__chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 2step 3step;
  }

  &_open {
    .database-item-sorting-section__symbol-arrow {
      transform: rotateX(180deg);
    }
  }

  .flip {
    transform: rotateX(180deg);
  }
}
</style>
