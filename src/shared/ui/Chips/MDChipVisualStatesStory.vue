<template>
  <div v-bind="rootAttrs" class="visual-surface">
    <div class="visual-row">
      <MDChip label="Assist" type="assist" />
      <MDChip label="Filter" type="filter" />
      <MDChip label="Selected filter" type="filter" selected />
    </div>
    <div class="visual-row">
      <MDChip label="Input chip" type="input" />
      <MDChip label="Elevated" type="assist" elevated />
      <MDChip label="Assist with icon" type="assist" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MDChip from './MDChip.vue';

const rootAttrs = {
  'data-testid': 'visual-md-chip-states',
};
</script>
