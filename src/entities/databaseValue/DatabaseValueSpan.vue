<script setup lang="ts">
import type {
  DatabaseItem,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument/migrations/state';
import { MDSymbol } from '@shared/ui/Icon';
import { isUndefined } from 'es-toolkit';
import { computed } from 'vue';

const { item, propertyId } = defineProps<{
  item: DatabaseItem | undefined;
  propertyId: DatabasePropertyId;
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
