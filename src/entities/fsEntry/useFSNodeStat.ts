import { useObservableQuery } from '@shared/lib/useObservableQuery';
import { useMainServiceClient } from '@shared/service/useService';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

/**
 * Reads the VFS stat for a path and exposes the latest value as query state.
 * @param path - Absolute VFS path to stat.
 * @returns Reactive stat value, raw error, safe message, and loading state.
 */
export const useFSNodeStat = (path: Ref<string>) => {
  const {
    fileSystem: { fsNodeStat },
  } = useMainServiceClient();

  const { data, error, isLoading } = useObservableQuery(
    fsNodeStat,
    computed(() => ({ path: path.value })),
  );

  const errorMessage = computed(() => {
    const e = toValue(error);

    if (isUndefined(e)) {
      return undefined;
    }

    if (e instanceof Error) {
      return e.message;
    }

    return 'Error reading stat';
  });

  return {
    data,
    error,
    errorMessage,
    isLoading,
  };
};
