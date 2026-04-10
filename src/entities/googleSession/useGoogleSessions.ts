import { useMainServiceClient } from '@shared/service';
import { createGlobalState } from '@vueuse/core';
import { useObservable } from '@shared/lib/useObservable';

const setupGoogleSessions = () => {
  const {
    google: { sessionList },
  } = useMainServiceClient();

  const { data, isLoading } = useObservable(sessionList);

  return {
    isLoading,
    sessionList: data,
  };
};

export const useGoogleSessions = createGlobalState(setupGoogleSessions);
