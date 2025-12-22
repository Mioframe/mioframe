import { useLiveResource } from '@shared/lib/useLiveResource';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useMainServiceClient } from '@shared/service/useService';
import type { Ref } from 'vue';

export const useDirectory = (
  path: Ref<string>,
  options?: Ref<ReadDirectoryOptions | undefined>,
) => {
  const {
    fileSystem: { readDirectory, onChangePath },
  } = useMainServiceClient();

  const { errorMessage, isLoading, isReady, state } = useLiveResource(
    () => ({ path: path.value, options: options?.value }),
    {
      fetch: ({ path, options }) => readDirectory(path, options),
      subscribe: ({ path }, cb) => onChangePath(path, cb),
      defaultErrorMessage: 'Error reading directory',
    },
  );

  return {
    state,
    errorMessage,
    isLoading,
    isReady,
  };
};
