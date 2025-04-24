import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { USERINFO_SCOPE } from '@shared/lib/googleApi/utils';
import { computed } from 'vue';

export const useGProfile = () => {
  const {
    requestAccess: requestAccess,
    userInfo,
    removeToken,
  } = useGoogleApi();

  const profile = computed(() => userInfo.value);

  const login = async () => {
    await requestAccess(
      USERINFO_SCOPE.userinfoEmail,
      USERINFO_SCOPE.userinfoProfile,
    );
  };

  return {
    remove: removeToken,
    profile,
    login,
  };
};
