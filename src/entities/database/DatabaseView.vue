<script setup lang="ts">
import type {
  UnknownProperty,
  DataBaseStateLatest,
  Item,
  PropertyId,
} from '../../shared/lib/databaseDocument';
import type { ItemId } from '../../shared/lib/databaseDocument/item';
import DatabaseTable from './table/DatabaseTable.vue';

defineProps<{
  databaseState: DataBaseStateLatest;
}>();

const slots = defineSlots<{
  value(props: {
    property: UnknownProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
    itemId: ItemId;
  }): unknown;
  itemActions(props: { item: Item; itemId: ItemId }): unknown;
}>();
</script>

<template>
  <section class="is-flex is-overflow-auto">
    <DatabaseTable :database-state class="is-flex-grow-1">
      <template #value="{ property, propertyId, value, itemId }">
        <slot name="value" :property :property-id :value :item-id />
      </template>

      <template v-if="!!slots.itemActions" #itemActions="scope">
        <slot name="itemActions" v-bind="scope" />
      </template>
    </DatabaseTable>
  </section>
</template>
