import { tryOnScopeDispose } from '@vueuse/core';
import { until } from '@vueuse/core';
import { uniqueId } from 'lodash-es';
import type { WatchHandle } from 'vue';
import { computed, reactive, ref, watchEffect } from 'vue';

export const lazyAsyncComputed = <T>(callback: () => T | Promise<T>) => {
  const data = ref<T>();
  const error = ref<unknown>();

  let fetchingId: string;

  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const fetchData = async () => {
    status.value = 'loading';
    error.value = undefined;
    fetchingId = uniqueId();
    const id = fetchingId;
    try {
      const result = await callback();
      if (fetchingId === id) {
        data.value = result;
        status.value = 'ready';
      }
    } catch (e) {
      if (fetchingId === id) {
        error.value = e;
        status.value = 'error';
      }
      throw e;
    }
  };

  const wait = async () => {
    await until(() => status.value === 'ready').toBeTruthy(); // FIXME: добавить статус ошибки
    return data.value;
  };

  let watchHandle: WatchHandle | undefined;

  let initiatedWatchEffect = false;

  const initWatchEffect = () => {
    initiatedWatchEffect = true;
    void Promise.resolve().then(() => {
      watchHandle = watchEffect(() => {
        void fetchData();
      });
    });
  };

  const update = async () => {
    await fetchData();
  };

  tryOnScopeDispose(() => {
    watchHandle?.stop();
    watchHandle = undefined;
    initiatedWatchEffect = false;
  });

  return reactive({
    value: computed(() => {
      if (!initiatedWatchEffect) {
        initWatchEffect();
      }
      return data.value;
    }),
    wait,
    status,
    update,
    error,
  });
};
