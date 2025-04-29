<script setup lang="ts">
import { computed } from 'vue';
import ItemTBody from './ItemTBody.vue';
import PropertyTHead from './PropertyTHead.vue';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseState,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/state';

const props = defineProps<{
  databaseState: DatabaseState;
}>();

const properties = computed(() => props.databaseState.properties);

const data = computed(() => props.databaseState.data);

const slots = defineSlots<{
  value(props: {
    property: DatabaseUnknownProperty | undefined;
    propertyId: DatabasePropertyId;
    value: unknown;
    itemId: DatabaseItemId;
  }): unknown;
  itemActions(props: { item: DatabaseItem; itemId: DatabaseItemId }): unknown;
}>();
</script>

<template>
  <table class="table is-striped is-fullwidth">
    <PropertyTHead
      class="table__head"
      :properties
      :show-actions-column="!!slots.itemActions"
    />

    <ItemTBody :data="data" :properties>
      <template #value="{ property, propertyId, value, itemId }">
        <slot name="value" :property :property-id :value :item-id />
      </template>

      <template v-if="!!slots.itemActions" #itemActions="scope">
        <slot name="itemActions" v-bind="scope" />
      </template>
    </ItemTBody>
  </table>
</template>

<style scoped>
.table {
  height: 100%;

  &__head {
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 1;
  }
}
</style>
