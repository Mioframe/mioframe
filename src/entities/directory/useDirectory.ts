import { useObservableQuery } from '@shared/lib/useObservableQuery';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useMainServiceClient } from '@shared/service/useService';
import { isUndefined } from 'es-toolkit';
import { computed, toValue, type Ref } from 'vue';
import { resolveSafeErrorMessage } from './resolveSafeErrorMessage';

/**
 * Reads directory entries and exposes reactive loading/error state.
 * @param path - Absolute filesystem path to read.
 * @param options - Optional read parameters forwarded to the service layer.
 * @returns Reactive data, raw error, user-facing message, loading flag, and refetch method.
 */
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

    return resolveSafeErrorMessage(e);
  });

  return {
    data,
    error,
    errorMessage,
    isLoading,
    refetch,
  };
};
