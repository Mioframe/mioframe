<template>
  <div v-bind="rootAttrs" class="visual-surface">
    <div class="visual-row">
      <MDChip label="Hover target" type="assist" />
      <MDChip label="Focus target" type="filter" />
      <MDChip label="Pressed target" type="input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MDChip from './MDChip.vue';

const rootAttrs = {
  'data-testid': 'visual-md-chip-interaction-states',
};
</script>
