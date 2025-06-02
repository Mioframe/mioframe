<script setup lang="ts">
import { MDListItem } from '../Lists';

defineProps<{
  text: string;
}>();

defineSlots<{
  leadingIcon(): unknown;
  trailingIcon(): unknown;
}>();
</script>

<template>
  <MDListItem class="md md-menus-list-item" :headline="text" is-button>
    <template v-if="!!$slots.leadingIcon" #leadingIcon>
      <slot name="leadingIcon" />
    </template>

    <template v-if="!!$slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" />
    </template>
  </MDListItem>
</template>

<style lang="css" scoped>
.md-menus-list-item.md-list-item {
  --md-container-color: inherit;
  --md-list-item-horizontal-gap: 12px;
  --md-list-item-min-height: 48px;
  :deep {
    .md-list-item__headline::first-letter {
      text-transform: uppercase;
    }
  }
}
</style>
