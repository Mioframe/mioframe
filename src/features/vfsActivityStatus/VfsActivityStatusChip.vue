<script setup lang="ts">
import { useVfsActivity } from '@entity/vfsActivity';
import { useMainServiceClient } from '@shared/service';
import { useFileSystemAccessPermissionBroker } from '@shared/serviceClient/fileSystem';
import { MDButton } from '@shared/ui/Button';
import { MDAssistChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { useSnackbar } from '@shared/ui/Snackbar';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { DomainError } from '@shared/lib/error';
import type { ComponentPublicInstance } from 'vue';
import { computed, ref, useTemplateRef } from 'vue';
import { CHIP_STATUS_LABELS, formatSaveStatusErrorDetails } from './saveStatusText';
import type { VisibleVfsActivityStatus } from './useVfsActivityStatusChipVisibility';
import { useWriteAccessRecoveryState } from './useWriteAccessRecoveryState';

const props = defineProps<{
  status: VisibleVfsActivityStatus;
}>();

const triggerRef = useTemplateRef<ComponentPublicInstance>('triggerRef');
const showErrorDetails = ref(false);
const isGrantWriteAccessLoading = ref(false);
const { addSnackbar } = useSnackbar();
const {
  fileSystem: { acknowledgeVfsActivityError: dismissSaveStatusError },
} = useMainServiceClient();
const { requestAccess } = useFileSystemAccessPermissionBroker();
const { state } = useVfsActivity();

const {
  writeAccessRecovery,
  hasWriteAccessRecovery,
  isStaleWriteAccessRequest,
  storageFailureAfterGrant,
  checkPendingRequest,
  markStorageFailureAfterGrant,
} = useWriteAccessRecoveryState(state);

const isError = computed(() => props.status === 'error');
const isActive = computed(() => props.status === 'active');
const label = computed(() => CHIP_STATUS_LABELS[props.status]);
const errorDetails = computed(() => formatSaveStatusErrorDetails(state.value.lastError));
const safeErrorMessageLines = computed(() => {
  const rawCause = state.value.lastError?.cause;
  if (!(rawCause instanceof DomainError)) {
    return [];
  }

  return rawCause.message
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
});

const onClickTrigger = () => {
  showErrorDetails.value = true;
  void checkPendingRequest();
};

const onClickDismissError = () => {
  dismissSaveStatusError();
  showErrorDetails.value = false;
};

const onClickCloseDetails = () => {
  showErrorDetails.value = false;
};

const isClipboardWithWriteText = (value: unknown): value is Pick<Clipboard, 'writeText'> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'writeText' in value &&
    typeof value.writeText === 'function'
  );
};

const onClickCopyDetails = async () => {
  if (!errorDetails.value) {
    return;
  }

  const clipboard = Reflect.get(navigator, 'clipboard');

  if (!isClipboardWithWriteText(clipboard)) {
    addSnackbar({ text: 'Clipboard is not available' });
    return;
  }

  try {
    await clipboard.writeText(errorDetails.value);
    addSnackbar({ text: 'Save error details copied' });
  } catch {
    addSnackbar({ text: 'Could not copy save error details' });
  }
};

const onClickGrantWriteAccess = async () => {
  if (isGrantWriteAccessLoading.value) {
    return;
  }

  const recovery = writeAccessRecovery.value;

  if (!recovery) {
    return;
  }

  isGrantWriteAccessLoading.value = true;

  try {
    const result = await requestAccess({
      operation: recovery.operation,
      requestedMode: 'readwrite',
      spaceName: recovery.spaceName,
    });

    if (result.status === 'granted') {
      dismissSaveStatusError();
      showErrorDetails.value = false;
      addSnackbar({ text: 'Write access granted. Future saves can continue.' });
      return;
    }

    if (result.status === 'grantedWithReplayFailures') {
      await checkPendingRequest();
      addSnackbar({
        text: 'Write access was granted, but some unsaved repository changes still could not be stored.',
      });
      return;
    }

    if (result.status === 'grantedWithStorageFailures') {
      markStorageFailureAfterGrant();
      dismissSaveStatusError();
      addSnackbar({
        text: 'Write access was granted, but replaying earlier unsaved repository changes hit another storage failure.',
      });
      return;
    }

    await checkPendingRequest();
    addSnackbar({
      text:
        result.status === 'error'
          ? 'Could not request browser write access. Try again from this action.'
          : 'Browser write access was not granted. Saving remains blocked.',
    });
  } catch {
    addSnackbar({
      text: 'Could not request browser write access. Try again from this action.',
    });
  } finally {
    isGrantWriteAccessLoading.value = false;
  }
};

const onInteractionOutside = () => {
  showErrorDetails.value = false;
};
</script>

<template>
  <MDAssistChip
    ref="triggerRef"
    :label="label"
    class="vfs-activity-status-chip"
    @click="onClickTrigger"
  >
    <template #leadingIcon>
      <MDSymbol
        :name="isError ? 'error' : 'sync'"
        :class="{ 'vfs-activity-status-chip__icon_error': isError }"
      />
    </template>
  </MDAssistChip>

  <MDOverlayTooltip
    :show="showErrorDetails"
    :target-element="triggerRef"
    @interaction-outside="onInteractionOutside"
  >
    <div class="vfs-activity-status-chip__tooltip">
      <template v-if="isActive">
        <p>Changes are still being saved.</p>
        <p>Keep this folder open until saving finishes.</p>
      </template>

      <template v-else>
        <template v-if="storageFailureAfterGrant">
          <p>Could not confirm the last save.</p>
          <p>Write access was granted but a storage failure prevented the save from completing.</p>
        </template>

        <template v-else-if="hasWriteAccessRecovery">
          <p>Browser write access is required to save changes in this remembered local space.</p>
          <p>Grant access to allow future saves.</p>
        </template>

        <template v-else-if="isStaleWriteAccessRequest">
          <p>Could not confirm the last save.</p>
          <p>
            The write access request is no longer pending. Dismiss this error and retry the
            operation.
          </p>
        </template>

        <template v-else-if="safeErrorMessageLines.length > 0">
          <p v-for="line in safeErrorMessageLines" :key="line">{{ line }}</p>
        </template>

        <template v-else>
          <p>Could not confirm the last save.</p>
          <p>Check this folder and retry if data should have changed.</p>
        </template>
      </template>
    </div>

    <div class="vfs-activity-status-chip__actions">
      <MDButton
        v-if="hasWriteAccessRecovery"
        color="text"
        :disabled="isGrantWriteAccessLoading"
        label="Grant write access"
        :loading="isGrantWriteAccessLoading"
        @click="onClickGrantWriteAccess"
      />
      <MDButton v-if="isError" color="text" label="Dismiss" @click="onClickDismissError" />
      <MDButton v-else color="text" label="Close" @click="onClickCloseDetails" />
      <MDButton
        v-if="isError"
        color="text"
        label="Copy details"
        :disabled="!errorDetails"
        @click="onClickCopyDetails"
      />
    </div>
  </MDOverlayTooltip>
</template>

<style scoped>
.vfs-activity-status-chip__icon_error {
  --md-content-color: var(--md-sys-color-error);
}

.vfs-activity-status-chip__tooltip {
  display: grid;
  gap: 8px;
  max-width: 480px;
}

.vfs-activity-status-chip__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
