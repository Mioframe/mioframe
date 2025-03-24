<script setup lang="ts">
import type { PropertyId } from '@shared/lib/databaseDocument';
import type { DatabaseItem } from '@shared/lib/databaseDocument/item/data';
import type { GeneralProperty } from '@shared/lib/databaseDocument/property';
import { MDSymbol } from '@shared/ui/Icon';
import { isUndefined } from 'lodash-es';
import { computed } from 'vue';

const { item, propertyId } = defineProps<{
  item: DatabaseItem | undefined;
  property: GeneralProperty;
  propertyId: PropertyId;
}>();

const value = computed(() => (item ? item[propertyId] : undefined));
</script>

<template>
  <span class="database-value-span">
    <template v-if="!isUndefined(value)">
      {{ value }}
    </template>

    <MDSymbol v-else name="unknown_med" class="database-value-span__empty" />
  </span>
</template>

<style lang="css" scoped>
.database-value-span {
  &__empty {
    --md-content-color: var(--md-sys-color-secondary);
    opacity: 0.5;
  }
}
</style>
