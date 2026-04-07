<script setup lang="ts">
import { useDatabaseProperty } from '@entity/databaseProperty';
import { useDatabaseSortDescription } from '@entity/databaseSorting/useDatabaseSortDescription';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  SORT_DIRECTION,
  type DatabasePropertyId,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListItem } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
  propertyId: DatabasePropertyId;
}>();

const { documentId, path, viewId, propertyId } = toRefs(props);

const slots = defineSlots<{
  trailingIcon: () => unknown;
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const headline = computed(() => property.value?.name ?? 'unknown property');

const { sortDescription, toggleDirection } = useDatabaseSortDescription(
  path,
  documentId,
  viewId,
  propertyId,
);

const onClick = async () => {
  await toggleDirection();
};
</script>

<template>
  <MDListItem
    is="button"
    :headline="headline"
    class="db-sorting-item"
    @click="onClick"
  >
    <template #leadingIcon>
      <MDSymbol
        class="db-sorting-item__symbol"
        name="sort"
        :class="{
          _flip: sortDescription?.direction === SORT_DIRECTION.ascending,
        }"
      />
    </template>

    <template v-if="slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" />
    </template>
  </MDListItem>
</template>

<style lang="css" scoped>
.db-sorting-item {
  &__symbol {
    transition-property: transform;

    &._flip {
      transform: rotateX(180deg);
    }
  }
}
</style>
