<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/migrations/versions';
import { SORT_DIRECTION } from '@shared/lib/databaseDocument/migrations/versions';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { MDMenuContainer } from '@shared/ui/Menu';
import { type MaybeElement } from '@vueuse/core';
import { difference } from 'es-toolkit';
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { useDatabaseViewSorting } from './useDatabaseItemSorting';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDChip } from '@shared/ui/Chips';
import { MDFieldContainer } from '@shared/ui/TextField';
import { MDSymbol } from '@shared/ui/Icon';
import { useOptionsNavigation } from '@shared/ui/Select';
import { MDListItem } from '@shared/ui/Lists';

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

const options = computed(() =>
  propertyWithoutSorting.value.map((propertyId) => ({
    labelText: databaseProperties.get(propertyId)?.name ?? 'unknown property',
    propertyId,
  })),
);

const fieldContainerRef = useTemplateRef<MaybeElement>('fieldContainerRef');
const menuContainerRef = useTemplateRef<MaybeElement>('menuContainerRef');
const optionsElements = useTemplateRef<MaybeElement[]>('optionsElements');

const optionToString = ({ propertyId }: { propertyId: DatabasePropertyId }) =>
  databaseProperties.get(propertyId)?.name ?? 'unknown property';

const sortListValue = computed({
  get: () =>
    databaseViewSorting.sortingList?.map(([propertyId, { direction }]) => ({
      labelText: databaseProperties.get(propertyId)?.name ?? 'unknown property',
      propertyId,
      direction,
    })) ?? [],
  set: (list) => {
    const deleteSortingId = new Set(databaseViewSorting.keys);

    list.forEach(({ propertyId }) => {
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

const { showMenu, filteredOptions, onClickOption, onClickFieldContainer } =
  useOptionsNavigation({
    fieldContainerRef,
    menuContainerRef,
    multiple: true,
    optionsElements,
    modelValue: sortListValue,
    options,
    optionToString,
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
  <section
    class="database-item-sorting-section"
    :class="{ 'database-item-sorting-section_open': showMenu }"
  >
    <MDFieldContainer
      ref="fieldContainerRef"
      label-text="Sorting"
      :filled="!!databaseViewSorting.size"
      :focused="showMenu"
      @click="onClickFieldContainer"
    >
      <div class="database-item-sorting-section__chip-list">
        <MDChip
          v-for="item in sortListState"
          :key="item.propertyId"
          type="input"
          :label="item.propertyName"
          @click-close="onClickRemoveOption(item.propertyId)"
          @click="onClickSelectedOption(item.propertyId)"
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
      </div>

      <template #trailingIcon>
        <MDSymbol
          name="arrow_drop_down"
          class="database-item-sorting-section__symbol-arrow"
        />
      </template>
    </MDFieldContainer>

    <MDMenuContainer
      v-if="showMenu"
      ref="menuContainerRef"
      :target-ref="fieldContainerRef"
    >
      <MDListItem
        is="button"
        v-for="option in filteredOptions"
        :key="optionToString(option)"
        ref="optionsElements"
        :headline="optionToString(option)"
        type="button"
        @click="onClickOption(option)"
      />
    </MDMenuContainer>
  </section>
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
