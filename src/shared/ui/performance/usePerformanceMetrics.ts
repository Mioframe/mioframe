import { tryOnMounted, tryOnScopeDispose } from '@vueuse/core';
import { once, round } from 'es-toolkit';
import type { Ref } from 'vue';
import { ref, computed } from 'vue';
import { onCLS, onINP, onLCP, onFCP } from 'web-vitals';

export interface LongTaskEntry {
  duration: number;
  startTime: number;
}

export interface PerformanceMetrics {
  fps: Ref<number | undefined>;
  lcp: Ref<number | undefined>;
  inp: Ref<number | undefined>;
  cls: Ref<number | undefined>;
  fcp: Ref<number | undefined>;
  longTasks: Ref<LongTaskEntry[]>;
}

const ONE_SECOND = 1000;
const LONG_TASK_THRESHOLD = 50; // ms
const MAX_LONG_TASKS = 5;

const onceInitialRef = <T>(callback: (valueRef: Ref<T | undefined>) => unknown) => {
  const value = ref<T>();

  const onceInit = once(() => {
    callback(value);
  });

  return computed(() => {
    onceInit();
    return value.value;
  });
};

/**
 * Vue composable that provides reactive performance metrics for an overlay.
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const fps = ref<number>();

  const lcp = onceInitialRef<number>((v) => {
    onLCP(({ value }) => (v.value = round(value, 4)));
  });

  const inp = onceInitialRef<number>((v) => {
    onINP(({ value }) => (v.value = round(value, 4)));
  });

  const cls = onceInitialRef<number>((v) => {
    onCLS(({ value }) => (v.value = round(value, 4)), {
      reportAllChanges: true,
    });
  });

  const fcp = onceInitialRef<number>((v) => {
    onFCP(({ value }) => (v.value = round(value, 4)), {
      reportAllChanges: true,
    });
  });

  const longTasks = ref<LongTaskEntry[]>([]);

  let frameCount = 0;
  let lastFrameTime = performance.now();
  let rafId: number;
  let longTaskObserver: PerformanceObserver;

  // Measure frames per second
  function measureFPS(now: number) {
    frameCount++;
    if (now - lastFrameTime >= ONE_SECOND) {
      fps.value = frameCount;
      frameCount = 0;
      lastFrameTime = now;
    }
    rafId = requestAnimationFrame(measureFPS);
  }

  // Observe long tasks
  function initLongTasksObserver() {
    longTaskObserver = new PerformanceObserver((list) => {
      for (const { duration, startTime } of list.getEntries()) {
        if (duration > LONG_TASK_THRESHOLD) {
          longTasks.value.push({
            duration,
            startTime: round(startTime, 3),
          });
          if (longTasks.value.length > MAX_LONG_TASKS) {
            longTasks.value.shift();
          }
        }
      }
    });
    longTaskObserver.observe({ entryTypes: ['longtask'] });
  }

  tryOnMounted(() => {
    rafId = requestAnimationFrame(measureFPS);
    initLongTasksObserver();
  });

  tryOnScopeDispose(() => {
    cancelAnimationFrame(rafId);
    longTaskObserver.disconnect();
  });

  return {
    fps,
    lcp,
    inp,
    cls,
    fcp,
    longTasks,
  };
}
