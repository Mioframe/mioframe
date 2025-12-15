import { computedAsyncLazy } from '@shared/lib/extendedAsyncComputed';
import { useMainServiceClient } from '@shared/service/useService';
import type { Ref } from 'vue';
import { watch } from 'vue';

export const useDirectory = (path: Ref<string>) => {
  const {
    fileSystem: { readDirectory, watch: watchPath },
  } = useMainServiceClient();

  const { error, refresh, state, status } = computedAsyncLazy(
    async () => await readDirectory(path.value),
    undefined,
  );

  const onWatch = () => {
    refresh();
  };

  let stopWatch: undefined | (() => unknown);

  watch(
    path,
    async (path) => {
      stopWatch?.();

      stopWatch = await watchPath(path, onWatch);
    },
    { immediate: true },
  );

  return {
    state,
    error,
    status,
  };
};
