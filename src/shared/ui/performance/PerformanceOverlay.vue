<script setup lang="ts">
import { usePerformanceMetrics } from './usePerformanceMetrics';

const { cls, fps, inp, lcp, longTasks } = usePerformanceMetrics();

const buildDate = new Date(__BUILD_DATE__).toLocaleString();
</script>

<template>
  <div class="performance-overlay">
    <div class="performance-overlay__item">v: {{ buildDate }}</div>

    <div
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 30 > (fps ?? 0),
        'performance-overlay_warn': 45 > (fps ?? 0),
      }"
    >
      fps:{{ fps }}
    </div>

    <div
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 0.1 < (cls ?? 0),
        'performance-overlay_warn': 0.05 < (cls ?? 0),
      }"
    >
      cls:{{ cls }}
    </div>

    <div
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 200 < (inp ?? 0),
        'performance-overlay_warn': 100 < (inp ?? 0),
      }"
    >
      inp:{{ inp }}
    </div>

    <div
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 2200 < (lcp ?? 0),
        'performance-overlay_warn': 1100 < (lcp ?? 0),
      }"
    >
      lcp:{{ lcp }}
    </div>

    <div class="performance-overlay__item">
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
