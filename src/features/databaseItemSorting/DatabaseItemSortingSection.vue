<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/migrations/versions';
import { SORT_DIRECTION } from '@shared/lib/databaseDocument/migrations/versions';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { difference } from 'es-toolkit';
import { computed, ref, toRefs, watchEffect } from 'vue';
import { useDatabaseViewSorting } from './useDatabaseItemSorting';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { MDSelect } from '@shared/ui/Select';

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
  })),
);

const sortListValue = computed({
  get: () =>
    databaseViewSorting.sortingList?.map(([propertyId, { direction }]) => ({
      label: databaseProperties.get(propertyId)?.name ?? 'unknown property',
      key: propertyId,
      direction,
    })) ?? [],
  set: (list) => {
    const deleteSortingId = new Set(databaseViewSorting.keys);

    list.forEach(({ key: propertyId }) => {
      deleteSortingId.delete(propertyId);
      if (!databaseViewSorting.has(propertyId)) {
        void databaseViewSorting.addSorting(propertyId);
      }
    });

    deleteSortingId.forEach((propertyId) => {
      void databaseViewSorting.remove(propertyId);
    });
  },
});

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
      <div class="database-item-sorting-section__chip-list">
        <!-- // TODO: добавить DnD сортировку значений -->
        <MDChip
          v-for="{ direction, key: propertyId, label } in sortListValue"
          :key="propertyId"
          type="input"
          :label="label"
          @click-close="onClickRemoveOption(propertyId)"
          @click="onClickSelectedOption(propertyId)"
        >
          <template #leadingIcon>
            <MDSymbol
              name="sort"
              :class="{
                flip: direction === SORT_DIRECTION.ascending,
              }"
            />
          </template>
        </MDChip>
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
