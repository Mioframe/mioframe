<script setup lang="ts">
import { computed } from 'vue';
import { usePageMemoryUsage } from './usePageMemoryUsage';
import { usePerformanceMetrics } from './usePerformanceMetrics';
import { CLSThresholds, INPThresholds, LCPThresholds } from 'web-vitals';
import { isUndefined, round } from 'es-toolkit';

const { cls, fps, inp, lcp, longTasks } = usePerformanceMetrics();

const buildDate = new Date(__BUILD_DATE__).toLocaleString();

const { memory } = usePageMemoryUsage();

const memoryKB = computed(() =>
  isUndefined(memory.value) ? undefined : round(memory.value.bytes / 1000),
);

const memoryMb = computed(() =>
  isUndefined(memoryKB.value) ? undefined : round(memoryKB.value / 1e3, 3),
);
</script>

<template>
  <div class="performance-overlay" aria-label="performance overlay">
    <div class="performance-overlay__item">v: {{ buildDate }}</div>

    <div
      v-if="fps !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 50 > fps,
        'performance-overlay_warn': 55 > fps,
      }"
    >
      fps: {{ fps }}
    </div>

    <div
      v-if="memoryMb !== undefined"
      class="performance-overlay__item"
      :class="{
        'performance-overlay_alarm': 200 < memoryMb,
        'performance-overlay_warn': 100 < memoryMb,
      }"
    >
      memoryMb: {{ memoryMb }}
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
      cls: {{ cls }}
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
      inp: {{ inp }}
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
      lcp: {{ lcp }}
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
  z-index: 1000;
  top: 0;
  right: 0;
  pointer-events: none;
  font-size: 0.6em;
  opacity: 0.8;
  color: white;
  text-shadow:
    0.5px 0.5px 0 #444,
    -0.5px 0.5px 0 #444,
    0.5px -0.5px 0 #444,
    -0.5px -0.5px 0 #444,
    0px 0.5px 0 #444,
    0px -0.5px 0 #444,
    -0.5px 0px 0 #444,
    0.5px 0px 0 #444,
    1px 1px 0 #444,
    -1px 1px 0 #444,
    1px -1px 0 #444,
    -1px -1px 0 #444,
    0px 1px 0 #444,
    0px -1px 0 #444,
    -1px 0px 0 #444,
    1px 0px 0 #444,
    0.5px 1px 0 #444,
    -0.5px 1px 0 #444,
    0.5px -1px 0 #444,
    -0.5px -1px 0 #444,
    1px 0.5px 0 #444,
    -1px 0.5px 0 #444,
    1px -0.5px 0 #444,
    -1px -0.5px 0 #444;

  &_warn {
    color: orange;
  }

  &_alarm {
    color: red;
  }
}
</style>
