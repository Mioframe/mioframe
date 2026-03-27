import { useMainServiceClient } from '@shared/service';
import { USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { useObservableQuery } from '@shared/lib/observableQuery';
import { createGlobalState } from '@vueuse/core';

type UserinfoGetReturn = Awaited<
  ReturnType<gapi.client.oauth2.UserinfoResource['get']>
>;

export type UserinfoGet = (
  ...args: Parameters<gapi.client.oauth2.UserinfoResource['get']>
) => Promise<UserinfoGetReturn>;

const setupGoogleSessions = () => {
  const {
    google: { requestToken, sessions, clear, remove },
  } = useMainServiceClient();

  const { data, isLoading } = useObservableQuery(sessions, () => undefined);

  const login = () => requestToken([USER_INFO_GOOGLE_SCOPE.userInfoProfile]);

  const logout = (email: string) => remove(email);

  return {
    isLoading,
    sessions: data,
    login,
    logout,
    clear,
    requestToken,
  };
};

export const useGoogleSessions = createGlobalState(setupGoogleSessions);
