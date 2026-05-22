<template>
  <div id="visual-md-chip-states" class="visual-surface">
    <div class="visual-row">
      <MDAssistChip label="Assist" />
      <MDAssistChip label="Assist with icon">
        <template #leadingIcon>
          <MDSymbol name="search" />
        </template>
      </MDAssistChip>
      <MDFilterChip label="Filter" />
    </div>
    <div class="visual-row">
      <MDFilterChip label="Selected filter" selected />
      <MDFilterChip label="Trailing icon">
        <template #trailingIcon>
          <MDSymbol name="arrow_drop_down" />
        </template>
      </MDFilterChip>
      <MDInputChip label="Input chip" />
    </div>
    <div class="visual-row">
      <MDInputChip label="Custom close label" close-tooltip="Remove input chip" />
      <MDAssistChip label="Elevated" elevated />
      <MDSuggestionChip label="Suggestion" />
    </div>
    <div class="visual-row">
      <MDAssistChip label="Disabled assist" disabled />
      <MDFilterChip label="Disabled filter" disabled />
      <MDInputChip label="Disabled input chip" disabled />
    </div>
    <div id="visual-md-chip-targets" class="visual-row">
      <MDSuggestionChip label="Disabled suggestion" disabled />
      <MDFilterChip label="Disabled selected filter" selected disabled />
      <MDAssistChip label="Disabled elevated assist" elevated disabled />
    </div>
    <div class="visual-row">
      <MDInputChip label="Close target" />
      <MDInputChip label="Disabled close target" disabled />
    </div>
  </div>
</template>

<script setup lang="ts">
import { MDSymbol } from '../Icon';
import { MDAssistChip, MDFilterChip, MDInputChip, MDSuggestionChip } from './index';
</script>
