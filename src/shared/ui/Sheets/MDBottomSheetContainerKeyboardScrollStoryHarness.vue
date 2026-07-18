<script setup lang="ts">
import { ref } from 'vue';
import MDBottomSheetContainer from './MDBottomSheetContainer2.vue';

const open = ref(true);
const scrollPosition = ref<number>();

// Enough rows that the sheet body is taller than the viewport, so wrapping keyboard focus
// between the first and last tabbable elements requires bringing an out-of-view element back
// into the bottom sheet's own visible area.
const rows = Array.from({ length: 30 }, (_, index) => `Row ${index}`);
</script>

<template>
  <MDBottomSheetContainer
    v-model:open="open"
    v-model:scroll-position="scrollPosition"
    aria-label="Keyboard scroll test sheet"
  >
    <ul class="md-bottom-sheet-container-keyboard-scroll-story-harness__list">
      <li v-for="row in rows" :key="row">
        <button type="button">{{ row }}</button>
      </li>
    </ul>
  </MDBottomSheetContainer>
</template>

<style scoped>
.md-bottom-sheet-container-keyboard-scroll-story-harness__list {
  list-style: none;
  margin: 0;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.md-bottom-sheet-container-keyboard-scroll-story-harness__list button {
  width: 100%;
  height: 48px;
}
</style>
