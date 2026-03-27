import { useObservableQuery } from '@shared/lib/observableQuery';
import { useMainServiceClient } from '@shared/service/useService';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';

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
    errorMessage,
    isLoading,
  };
};
