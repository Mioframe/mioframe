import { useMainServiceClient } from '@shared/service/useService';
import { asyncComputed } from '@vueuse/core';
import type { Ref } from 'vue';
import { ref } from 'vue';

export const useDirectory = (path: Ref<string>) => {
  const client = useMainServiceClient();

  const { readDirectory } = client.fileSystem;

  const error = ref<unknown>();
  const evaluating = ref(false);

  const state = asyncComputed(
    async () => await readDirectory(path.value),
    undefined,
    {
      evaluating,
      lazy: true,
      onError: (e) => {
        error.value = e;
      },
    },
  );

  return {
    state,
    error,
    evaluating,
  };
};
