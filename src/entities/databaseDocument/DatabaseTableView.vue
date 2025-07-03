<script setup lang="ts">
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseState,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument/migrations/versions';
import DatabaseTable from './table/DatabaseTable.vue';

defineProps<{
  databaseState: DatabaseState;
}>();

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
