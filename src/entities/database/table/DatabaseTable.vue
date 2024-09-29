<script setup lang="ts">
import { computed } from 'vue';
import type {
  AnyProperty,
  DataBaseStateLatest,
  PropertyId,
} from '../../../shared/lib/databaseDocument';
import ItemTBody from './ItemTBody.vue';
import PropertyTHead from './PropertyTHead.vue';

const props = defineProps<{
  databaseState: DataBaseStateLatest;
}>();

const properties = computed(() => props.databaseState.properties);

const data = computed(() => props.databaseState.data);

defineSlots<{
  value(props: {
    property: AnyProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
  }): unknown;
}>();
</script>

<template>
  <table class="table is-striped is-fullwidth">
    <PropertyTHead class="table__head" :properties />

    <ItemTBody :data="data" :properties>
      <template #value="{ property, propertyId, value }">
        <slot name="value" :property :property-id :value />
      </template>
    </ItemTBody>
  </table>
</template>

<style lang="scss" scoped>
.table {
  &__head {
    position: sticky;
    top: 0;
    background: inherit;
    z-index: 1;
  }
}
</style>
