import { useMainServiceClient } from '@shared/service';
import { USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { createGlobalState } from '@vueuse/core';
import { useObservable } from '@shared/lib/useObservable';

type UserinfoGetReturn = Awaited<ReturnType<gapi.client.oauth2.UserinfoResource['get']>>;

export type UserinfoGet = (request: {
  oauth_token?: string | undefined;
}) => Promise<UserinfoGetReturn>;

const setupGoogleSessions = () => {
  const {
    google: { requestToken, sessions, clear, deleteSession, revokeAccess },
  } = useMainServiceClient();

  const { data, isLoading } = useObservable(sessions);

  const login = () => requestToken([USER_INFO_GOOGLE_SCOPE.userInfoProfile]);

  return {
    isLoading,
    sessions: data,
    login,
    deleteSession,
    revokeAccess,
    clear,
    requestToken,
  };
};

export const useGoogleSessions = createGlobalState(setupGoogleSessions);
