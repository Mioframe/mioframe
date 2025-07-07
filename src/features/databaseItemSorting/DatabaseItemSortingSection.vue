<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseViewId,
  SORT_DIRECTION,
} from '@shared/lib/databaseDocument/migrations/versions';
import { type DatabasePropertyId } from '@shared/lib/databaseDocument/migrations/versions';
import { MDMenu, defineMenuButtonList } from '@shared/ui/Menu';
import { type MaybeElement } from '@vueuse/core';
import { difference } from 'es-toolkit';
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { useDatabaseViewSorting } from './useDatabaseItemSorting';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDChip } from '@shared/ui/Chips';
import { MDFieldContainer } from '@shared/ui/TextField';

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

const addBtnRef = useTemplateRef<MaybeElement>('addBtnRef');

const showAddPropertyMenu = ref(false);

const propertyWithoutSorting = computed(() =>
  databaseProperties.keys && databaseViewSorting.keys
    ? difference(databaseProperties.keys, databaseViewSorting.keys)
    : undefined,
);

const menu = computed(() =>
  propertyWithoutSorting.value
    ? defineMenuButtonList(
        propertyWithoutSorting.value.map((id) => [
          id,
          {
            text: databaseProperties.get(id)?.name ?? 'unknown property',
            symbolName: 'add',
          },
        ]),
      )
    : undefined,
);

const onClickMenuProperty = async (id: DatabasePropertyId) => {
  await databaseViewSorting.addSorting(id);

  showAddPropertyMenu.value = false;
};
</script>

<template>
  <section class="database-item-sorting-section">
    <MDFieldContainer label-text="Sorting" :filled="!!databaseViewSorting.size">
      <div class="database-item-sorting-section__chip-list">
        <MDChip
          v-for="item in sortListState"
          :key="item.propertyId"
          type="input"
          :label="item.propertyName"
        />
      </div>
    </MDFieldContainer>

    <MDChip
      ref="addBtnRef"
      label="add sorting"
      type="assist"
      @click="showAddPropertyMenu = !showAddPropertyMenu"
    />

    <MDMenu
      v-model:show="showAddPropertyMenu"
      :target-el="addBtnRef"
      :btns="menu"
      @click="onClickMenuProperty"
    />
  </section>
</template>

<style lang="css" scoped>
.database-item-sorting-section {
  &__chip-list {
    display: flex;
    flex-wrap: wrap;
    gap: 2step 3step;
  }
}

.flip {
  transform: rotateX(180deg);
}
</style>
