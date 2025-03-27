import { useGoogleApi } from '@shared/lib/googleApi/useGoogleApi';
import { USERINFO_SCOPE, loadGoogle } from '@shared/lib/googleApi/utils';
import { computed } from 'vue';

export const useGProfile = () => {
  const {
    requestAccess: checkGrantedAndRequestAccess,
    userInfo,
    removeToken,
  } = useGoogleApi();

  const profile = computed(() => userInfo.value);

  const login = async () => {
    await checkGrantedAndRequestAccess(
      await loadGoogle(),
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
