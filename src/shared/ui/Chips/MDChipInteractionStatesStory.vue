<template>
  <div id="visual-md-chip-interaction-states" class="visual-surface">
    <div class="visual-row">
      <MDAssistChip class="md-state_hover" label="Hover" />
      <MDFilterChip class="md-state_focused" label="Focus" />
      <MDInputChip class="md-state_pressed" label="Pressed" />
    </div>
    <div class="visual-row">
      <MDSuggestionChip class="md-state_dragged" label="Dragged" draggable />
      <MDFilterChip class="md-state_hover" label="Filter hover selected" selected />
      <MDInputChip class="md-state_focused" label="Input focus" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MDAssistChip, MDFilterChip, MDInputChip, MDSuggestionChip } from './index';
</script>
