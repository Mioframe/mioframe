<script setup lang="ts">
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { toRefs } from 'vue';
import { useGoogleSessionManage } from './useGoogleSessionManage';

const props = defineProps<{
  email: string;
}>();

const { email } = toRefs(props);

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

const { activeAction, actionTooltip, deleteGoogleSession, revokeGoogleAccess } =
  useGoogleSessionManage(() => email.value);

const onClickSessionAction = async ({ key }: { key: GoogleSessionAction }) => {
  if (activeAction.value) {
    return;
  }

  switch (key) {
    case GoogleSessionAction.deleteSession: {
      await deleteGoogleSession();
      break;
    }
    case GoogleSessionAction.revokeAccess: {
      await revokeGoogleAccess();
      break;
    }
    default:
      throw new Error('Unknown Google session action');
  }
};
</script>

<template>
  <MDContextMenuButton
    :btns="actionBtns"
    :loading="!!activeAction"
    :tooltip="actionTooltip"
    @click="onClickSessionAction"
  />
</template>
