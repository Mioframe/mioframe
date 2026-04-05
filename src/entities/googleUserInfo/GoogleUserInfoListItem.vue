<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import { useGoogleUserInfo } from './useGoogleUserInfo';
import { useGoogleSessions } from './useGoogleSessions';
import { computed, ref, toRefs } from 'vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { useSnackbar } from '@shared/ui/Snackbar';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';

const props = defineProps<{
  email: string;
}>();

const { email } = toRefs(props);

defineSlots<{
  mediaRight(): unknown;
}>();

const {
  data: userInfo,
  profileImageBlobUrl,
  evaluating,
} = useGoogleUserInfo(email);

const { deleteSession, revokeAccess } = useGoogleSessions();
const activeAction = ref<'delete' | 'revoke'>();
const { addSnackbar } = useSnackbar();

enum GoogleSessionAction {
  deleteSession,
  revokeAccess,
}

const actionBtns = defineMenuButtonList([
  {
    key: GoogleSessionAction.deleteSession,
    label: 'Delete session',
    symbolName: 'logout',
  },
  {
    key: GoogleSessionAction.revokeAccess,
    label: 'Revoke access',
    symbolName: 'link_off',
  },
]);

const headlineUser = computed(() =>
  userInfo.value instanceof Error ? undefined : userInfo.value?.name,
);

const supportingTextUser = computed(() =>
  userInfo.value instanceof Error ? undefined : userInfo.value?.email,
);

const profileImageUrl = computed(() =>
  profileImageBlobUrl.value instanceof Error
    ? undefined
    : profileImageBlobUrl.value,
);

const error = computed(() =>
  userInfo.value instanceof Error ? userInfo.value : undefined,
);

const onClickDeleteSession = async () => {
  activeAction.value = 'delete';
  try {
    await deleteSession(email.value);
  } catch (error) {
    addSnackbar({
      text: error instanceof Error ? error.message : 'Failed to delete session',
    });
  } finally {
    activeAction.value = undefined;
  }
};

const onClickRevokeAccess = async () => {
  activeAction.value = 'revoke';
  try {
    await revokeAccess(email.value);
  } catch (error) {
    addSnackbar({
      text: error instanceof Error ? error.message : 'Failed to revoke access',
    });
  } finally {
    activeAction.value = undefined;
  }
};

const onClickSessionAction = async ({ key }: { key: GoogleSessionAction }) => {
  if (activeAction.value) {
    return;
  }

  switch (key) {
    case GoogleSessionAction.deleteSession: {
      await onClickDeleteSession();
      break;
    }
    case GoogleSessionAction.revokeAccess: {
      await onClickRevokeAccess();
      break;
    }
    default:
      throw new Error('Unknown Google session action');
  }
};

const actionTooltip = computed(() => `options ${email.value}`);

const headline = computed(() => {
  if (evaluating.value) {
    return 'Loading';
  }

  if (error.value) {
    return 'Google profile error';
  }

  return headlineUser.value ?? 'Google profile';
});

const supportingText = computed(() => {
  if (error.value) {
    return error.value.message;
  }

  return supportingTextUser.value;
});

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
  <MDListItem
    is="button"
    :headline="headline"
    :supporting-text="supportingText"
    @click="emit('click')"
  >
    <template #leadingAvatarContainer>
      <MDCircularProgressIndicator v-if="evaluating" />

      <img
        v-else-if="profileImageUrl"
        :src="profileImageUrl"
        width="100%"
        height="100%"
      />
    </template>

    <template v-if="!evaluating" #trailingIcon>
      <MDCircularProgressIndicator v-if="activeAction" :size="24" />

      <MDContextMenuButton
        v-else
        :btns="actionBtns"
        :tooltip="actionTooltip"
        @click="onClickSessionAction"
      />
    </template>
  </MDListItem>
</template>
