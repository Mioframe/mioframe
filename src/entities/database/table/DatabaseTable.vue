<script setup lang="ts">
import { computed } from 'vue';
import type {
  AnyProperty,
  DataBaseStateLatest,
  Item,
  PropertyId,
} from '../../../shared/lib/databaseDocument';
import ItemTBody from './ItemTBody.vue';
import PropertyTHead from './PropertyTHead.vue';
import type { ItemId } from '../../../shared/lib/databaseDocument/item';

const props = defineProps<{
  databaseState: DataBaseStateLatest;
}>();

const properties = computed(() => props.databaseState.properties);

const data = computed(() => props.databaseState.data);

const slots = defineSlots<{
  value(props: {
    property: AnyProperty | undefined;
    propertyId: PropertyId;
    value: unknown;
  }): unknown;
  itemActions(props: { item: Item; itemId: ItemId }): unknown;
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
      <template #value="{ property, propertyId, value }">
        <slot name="value" :property :property-id :value />
      </template>

      <template v-if="!!slots.itemActions" #itemActions="scope">
        <slot name="itemActions" v-bind="scope" />
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
