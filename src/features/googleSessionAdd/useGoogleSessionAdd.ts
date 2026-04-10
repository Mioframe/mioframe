import { USER_INFO_GOOGLE_SCOPE } from '@shared/lib/googleApi/types';
import { useMainServiceClient } from '@shared/service';
import { useSnackbar } from '@shared/ui/Snackbar';
import { ref } from 'vue';

export const useGoogleSessionAdd = () => {
  const {
    google: { requestToken },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();

  const isLoading = ref(false);

  const addAccount = async () => {
    if (isLoading.value) {
      return;
    }

    isLoading.value = true;
    try {
      await requestToken([USER_INFO_GOOGLE_SCOPE.userInfoProfile]);
    } catch (error) {
      addSnackbar({
        text: error instanceof Error ? error.message : 'Failed to add Google account',
      });
    } finally {
      isLoading.value = false;
    }
  };

  return {
    addAccount,
    isLoading,
  };
};
