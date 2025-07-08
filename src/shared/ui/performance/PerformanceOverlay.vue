<script setup lang="ts">
import { usePerformanceMetrics } from './usePerformanceMetrics';
import { CLSThresholds, INPThresholds, LCPThresholds } from 'web-vitals';

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
        'performance-overlay_alarm': cls > CLSThresholds[1],
        'performance-overlay_warn':
          cls > CLSThresholds[0] && cls <= CLSThresholds[1],
      }"
    >
      cls:{{ cls }}
    </div>

    <div
      v-if="inp !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': inp > INPThresholds[1],
        'performance-overlay_warn':
          inp > INPThresholds[0] && inp <= INPThresholds[1],
      }"
    >
      inp:{{ inp }}
    </div>

    <div
      v-if="lcp !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': lcp > LCPThresholds[1],
        'performance-overlay_warn':
          lcp > LCPThresholds[0] && lcp <= LCPThresholds[1],
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
