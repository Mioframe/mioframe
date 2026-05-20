<template>
  <div id="visual-md-chip-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDChip class="md-state_hover" label="Hover" type="assist" />
      <MDChip class="md-state_focused" label="Focus" type="filter" />
      <MDChip class="md-state_pressed" label="Pressed" type="input" />
    </div>
    <div class="visual-row">
      <MDChip class="md-state_dragged" label="Dragged" type="suggestion" draggable />
      <MDChip class="md-state_hover" label="Filter hover selected" type="filter" selected />
      <MDChip class="md-state_focused" label="Input focus" type="input" />
    </div>
  </div>
</template>

<script setup lang="ts">
import MDChip from './MDChip.vue';
</script>
