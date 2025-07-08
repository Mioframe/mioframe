<script setup lang="ts">
import { usePerformanceMetrics } from './usePerformanceMetrics';

const { cls, fps, inp, lcp, longTasks } = usePerformanceMetrics();

const buildDate = new Date(__BUILD_DATE__).toLocaleString();
</script>

<template>
  <div class="performance-overlay">
    <div class="performance-overlay__item">v: {{ buildDate }}</div>

    <div
      v-if="fps !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 30 > fps,
        'performance-overlay_warn': 45 > fps,
      }"
    >
      fps:{{ fps }}
    </div>

    <div
      v-if="cls !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 0.1 < cls,
        'performance-overlay_warn': 0.05 < cls,
      }"
    >
      cls:{{ cls }}
    </div>

    <div
      v-if="inp !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 200 < inp,
        'performance-overlay_warn': 100 < inp,
      }"
    >
      inp:{{ inp }}
    </div>

    <div
      v-if="lcp !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 2200 < lcp,
        'performance-overlay_warn': 1100 < lcp,
      }"
    >
      lcp:{{ lcp }}
    </div>

    <div v-if="longTasks.length > 0" class="performance-overlay__item">
      longTasks:
      <pre>{{ longTasks }}</pre>
    </div>
  </div>
</template>

<style lang="css" scoped>
.performance-overlay {
  position: fixed;
  z-index: 1;
  top: 0;
  right: 0;
  pointer-events: none;
  font-size: 0.7em;

  &_warn {
    color: orange;
  }

  &_alarm {
    color: red;
  }
}
</style>
