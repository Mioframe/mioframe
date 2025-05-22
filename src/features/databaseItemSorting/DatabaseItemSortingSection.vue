<script setup lang="ts">
import type {
  DatabaseSortList,
  DatabaseUnknownPropertiesMap,
} from '@shared/lib/databaseDocument/state';
import { writableDeepClone } from '@shared/lib/writableDeepClone';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { ref, watchEffect } from 'vue';

/**
 * Порядок сортировки по значениям свойств.
 * - на первом месте опциональна ручная сортировка (в будущем)
 */

const { sortList } = defineProps<{
  property: DatabaseUnknownPropertiesMap;
  sortList?: DatabaseSortList;
}>();

const sortListState = ref<DatabaseSortList>([]);

watchEffect(() => {
  sortListState.value = writableDeepClone(sortList) ?? [];
});

// TODO
</script>

<template>
  <section class="database-item-sorting-section">
    <MDListContainer>
      <MDListItem headline="Property Name">
        <template #leadingIcon>
          <MDIconButton tooltip="drag" md-symbol-name="drag_indicator" />
        </template>

        <template #trailingIcon>
          <MDIconButton
            tooltip="Sorting direction"
            md-symbol-name="arrow_downward"
          />
        </template>
      </MDListItem>

      <MDListItem headline="Add Sorting">
        <template #leadingIcon>
          <MDSymbol name="add" />
        </template>
      </MDListItem>
    </MDListContainer>
  </section>
</template>
