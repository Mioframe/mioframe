<script setup lang="ts">
import type {
  AnyProperty,
  DataBaseStateLatest,
  PropertyId,
} from '../../shared/lib/databaseDocument';
import DatabaseTable from './table/DatabaseTable.vue';

defineProps<{
  databaseState: DataBaseStateLatest;
}>();

defineSlots<{
  value(props: {
    property: AnyProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
  }): unknown;
}>();
</script>

<template>
  <section class="is-flex is-overflow-auto">
    <DatabaseTable :database-state class="is-flex-grow-1">
      <template #value="{ property, propertyId, value }">
        <slot name="value" :property :property-id :value />
      </template>
    </DatabaseTable>
  </section>
</template>
