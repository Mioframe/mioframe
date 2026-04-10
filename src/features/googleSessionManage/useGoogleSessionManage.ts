import { useMainServiceClient } from '@shared/service';
import { useSnackbar } from '@shared/ui/Snackbar';
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue';

export const useGoogleSessionManage = (email: MaybeRefOrGetter<string>) => {
  const {
    google: { deleteSession, revokeAccess },
  } = useMainServiceClient();
  const { addSnackbar } = useSnackbar();

  const activeAction = ref<'delete' | 'revoke'>();
  const actionTooltip = computed(() => `options ${toValue(email)}`);

  const deleteGoogleSession = async () => {
    activeAction.value = 'delete';
    try {
      await deleteSession(toValue(email));
    } catch (caughtError) {
      addSnackbar({
        text: caughtError instanceof Error ? caughtError.message : 'Failed to delete session',
      });
    } finally {
      activeAction.value = undefined;
    }
  };

  const revokeGoogleAccess = async () => {
    activeAction.value = 'revoke';
    try {
      await revokeAccess(toValue(email));
    } catch (caughtError) {
      addSnackbar({
        text: caughtError instanceof Error ? caughtError.message : 'Failed to revoke access',
      });
    } finally {
      activeAction.value = undefined;
    }
  };

  return {
    activeAction,
    actionTooltip,
    deleteGoogleSession,
    revokeGoogleAccess,
  };
};
