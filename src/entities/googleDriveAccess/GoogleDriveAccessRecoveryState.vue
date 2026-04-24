<script setup lang="ts">
import { computed } from 'vue';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDSymbol } from '@shared/ui/Icon';
import { GoogleDriveAccessRecoveryKind } from './useGoogleDriveAccessRecoveryState';
import { useGoogleDriveAccessRecoveryState } from './useGoogleDriveAccessRecoveryState';

const { errors, path } = defineProps<{
  path: string;
  errors: unknown[];
}>();

defineSlots<{
  actions: () => unknown;
}>();

const { state } = useGoogleDriveAccessRecoveryState({
  path: () => path,
  errors: () => errors,
});

const actualEmail = computed(() => state.value?.actualEmail ?? '');
const expectedEmail = computed(() => state.value?.expectedEmail ?? '');
const kind = computed(() => state.value?.kind);

const headline = computed(() => {
  switch (kind.value) {
    case GoogleDriveAccessRecoveryKind.popupBlocked:
      return 'Authorization Window Was Blocked';
    case GoogleDriveAccessRecoveryKind.accountMismatch:
      return 'A Different Google Account Is Required';
    case GoogleDriveAccessRecoveryKind.reauthRequired:
    default:
      return 'Authorization Required';
  }
});

const supportingText = computed(() => {
  switch (kind.value) {
    case GoogleDriveAccessRecoveryKind.popupBlocked:
      return 'Your browser blocked the Google sign-in window. Allow pop-ups for this site and retry authorization.';
    case GoogleDriveAccessRecoveryKind.accountMismatch:
      return `Access requires the Google account ${expectedEmail.value}, but you are signed in as ${actualEmail.value}.`;
    case GoogleDriveAccessRecoveryKind.reauthRequired:
    default:
      return `Access to this Google Drive data requires signing in as ${expectedEmail.value}.`;
  }
});
</script>

<template>
  <MDEmptyState
    v-if="state"
    class="google-drive-access-recovery-state"
    :headline="headline"
    :supporting-text="supportingText"
  >
    <template #icon>
      <MDSymbol name="account_circle" class="google-drive-access-recovery-state__icon" />
    </template>

    <template #actions>
      <slot name="actions" />
    </template>
  </MDEmptyState>

  <template v-else />
</template>

<style scoped>
.google-drive-access-recovery-state {
  &__icon {
    --md-content-color: var(--md-sys-color-error);
  }
}
</style>
