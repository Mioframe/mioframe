import { tryOnScopeDispose } from '@vueuse/core';
import { round } from 'es-toolkit';
import type { Ref } from 'vue';
import { ref, onMounted } from 'vue';
import type { Metric } from 'web-vitals';
import { onCLS, onINP, onLCP } from 'web-vitals';

export interface LongTaskEntry {
  duration: number;
  startTime: number;
}

export interface PerformanceMetrics {
  fps: Ref<number | undefined>;
  lcp: Ref<number | undefined>;
  inp: Ref<number | undefined>;
  cls: Ref<number | undefined>;
  longTasks: Ref<LongTaskEntry[]>;
}

const ONE_SECOND = 1000;
const LONG_TASK_THRESHOLD = 50; // ms
const MAX_LONG_TASKS = 5;

/**
 * Vue composable that provides reactive performance metrics for an overlay.
 */
export function usePerformanceMetrics(): PerformanceMetrics {
  const fps = ref<number>();
  const lcp = ref<number>();
  const inp = ref<number>();
  const cls = ref<number>();
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

  // Initialize Web Vitals metrics
  function initWebVitals() {
    onLCP((metric: Metric) => {
      lcp.value = round(metric.value, 4);
    });
    onINP((metric: Metric) => {
      inp.value = round(metric.value, 4);
    });
    onCLS(
      (metric: Metric) => {
        cls.value = round(metric.value, 4);
      },
      { reportAllChanges: true },
    );
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

  onMounted(() => {
    rafId = requestAnimationFrame(measureFPS);
    initWebVitals();
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
    longTasks,
  };
}
