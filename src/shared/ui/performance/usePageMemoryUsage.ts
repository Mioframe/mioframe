import { zodIs } from '@shared/lib/validateZodScheme';
import { tryOnScopeDispose } from '@vueuse/core';
import { isFunction, once } from 'es-toolkit';
import { computed, ref } from 'vue';
import type { output } from 'zod/v4-mini';
import { number, object } from 'zod/v4-mini';

const zodMemory = object({ bytes: number() });

type Memory = output<typeof zodMemory>;

/**
 * Хук для отслеживания потребляемой памяти страницы.
 * @param intervalMs — интервал обновления в миллисекундах (по умолчанию 1000).
 * @returns ref с количеством байт, занятых JS-кучей, или undefined, если API не поддерживается.
 */
export const usePageMemoryUsage = (intervalMs = 1e3) => {
  const memory = ref<Memory>();

  let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

  const runMemoryMeasurements = () => {
    timeoutId = setTimeout(() => {
      void measureMemory();
    }, intervalMs);
  };

  const measureMemory = async () => {
    if (
      'measureUserAgentSpecificMemory' in performance &&
      isFunction(performance.measureUserAgentSpecificMemory)
    ) {
      const result = await performance.measureUserAgentSpecificMemory();

      memory.value = zodIs(result, zodMemory) ? result : undefined;
      runMemoryMeasurements();
    } else {
      memory.value = undefined;
    }
  };

  tryOnScopeDispose(() => {
    clearTimeout(timeoutId);
  });

  const onceInitial = once(() => {
    runMemoryMeasurements();
  });

  return {
    memory: computed(() => {
      onceInitial();
      return memory.value;
    }),
  };
};
