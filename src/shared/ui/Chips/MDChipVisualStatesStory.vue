<template>
  <div id="visual-md-chip-states" class="visual-surface">
    <div class="visual-row">
      <MDChip label="Assist" type="assist" />
      <MDChip label="Filter" type="filter" />
      <MDChip label="Selected filter" type="filter" selected />
    </div>
    <div class="visual-row">
      <MDChip label="Input chip" type="input" />
      <MDChip label="Elevated" type="assist" elevated />
      <MDChip label="Suggestion" type="suggestion" />
    </div>
    <div class="visual-row">
      <MDChip label="Disabled assist" type="assist" disabled />
      <MDChip label="Disabled filter" type="filter" selected disabled />
      <MDChip label="Disabled input chip" type="input" disabled />
    </div>
    <div id="visual-md-chip-targets" class="visual-row">
      <MDChip label="Close target" type="input" />
      <MDChip label="Disabled suggestion" type="suggestion" disabled />
    </div>
  </div>
</template>

<script setup lang="ts">
import MDChip from './MDChip.vue';
</script>
