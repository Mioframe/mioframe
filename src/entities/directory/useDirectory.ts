import { useObservableQuery } from '@shared/lib/useObservableQuery';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useMainServiceClient } from '@shared/service/useService';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

export const useDirectory = (
  path: Ref<string>,
  options?: Ref<ReadDirectoryOptions | undefined>,
) => {
  const {
    fileSystem: { directoryContent },
  } = useMainServiceClient();

  const { data, error, isLoading, refetch } = useObservableQuery(
    directoryContent,
    computed(() => ({ options: options?.value, path: path.value })),
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading directory';
  });

  return {
    data,
    error,
    errorMessage,
    isLoading,
    refetch,
  };
};
