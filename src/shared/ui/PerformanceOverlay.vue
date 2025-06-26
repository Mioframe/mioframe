<script setup lang="ts">
import { useFps } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import { ref, watch } from 'vue';

const fps = useFps({ every: 15 });

const minFps = ref<number>();

watch(fps, (fps) => {
  if (isUndefined(minFps.value) || minFps.value > fps) {
    minFps.value = fps;
  }
});
</script>

<template>
  <div class="performance-overlay">
    <div class="performance-overlay__fps">{{ fps }}</div>

    <div class="performance-overlay__min-fps">min:{{ minFps }}</div>
  </div>
</template>

<style lang="css" scoped>
.performance-overlay {
  position: fixed;
  top: 0;
  right: 0;
  pointer-events: none;
}
</style>
