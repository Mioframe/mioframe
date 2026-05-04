<script setup lang="ts">
import { useVfsActivity } from '@entity/vfsActivity';
import { useMainServiceClient } from '@shared/service';
import { MDButton, MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { useSnackbar } from '@shared/ui/Snackbar';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import type { ComponentPublicInstance } from 'vue';
import { computed, ref, useTemplateRef } from 'vue';
import {
  formatSaveStatusErrorDetails,
  formatSaveStatusTimestamp,
  STATUS_LABELS,
} from './saveStatusText';

const STATUS_ICONS = {
  idle: 'check_circle',
  error: 'error',
} as const;

const triggerRef = useTemplateRef<ComponentPublicInstance>('triggerRef');
const showErrorDetails = ref(false);
const { addSnackbar } = useSnackbar();
const {
  fileSystem: { acknowledgeVfsActivityError: dismissSaveStatusError },
} = useMainServiceClient();
const { hasUnacknowledgedError, isActive, state } = useVfsActivity();

const isError = computed(() => state.value.status === 'error');
const tooltip = computed(() => STATUS_LABELS[state.value.status]);
const iconName = computed(() =>
  state.value.status === 'active' ? undefined : STATUS_ICONS[state.value.status],
);
const errorDetails = computed(() => formatSaveStatusErrorDetails(state.value.lastError));
const formattedErrorTime = computed(() =>
  state.value.lastError ? formatSaveStatusTimestamp(state.value.lastError.occurredAt) : undefined,
);

const onClickTrigger = () => {
  if (!isError.value) {
    return;
  }

  showErrorDetails.value = true;
};

const onClickDismissError = () => {
  dismissSaveStatusError();
  showErrorDetails.value = false;
};

const onClickCopyDetails = async () => {
  if (!errorDetails.value) {
    return;
  }

  if (!('clipboard' in navigator)) {
    addSnackbar({ text: 'Clipboard is not available' });
    return;
  }

  try {
    await navigator.clipboard.writeText(errorDetails.value);
    addSnackbar({ text: 'Save error details copied' });
  } catch {
    addSnackbar({ text: 'Could not copy save error details' });
  }
};

const onInteractionOutside = () => {
  showErrorDetails.value = false;
};
</script>

<template>
  <MDIconButton ref="triggerRef" :tooltip="tooltip" :loading="isActive" @click="onClickTrigger">
    <template v-if="iconName" #icon>
      <MDSymbol :name="iconName" :class="{ 'save-status-button__icon_error': isError }" />
    </template>
  </MDIconButton>

  <MDOverlayTooltip
    v-if="isError && hasUnacknowledgedError"
    :show="showErrorDetails"
    :target-element="triggerRef"
    @interaction-outside="onInteractionOutside"
  >
    <div class="save-status-button__tooltip">
      <p>
        The app could not confirm that your data was written to storage. Do not close the app if
        your latest changes are important.
      </p>
      <p>Operation: {{ state.lastError?.operationType }}</p>
      <p>Path: {{ state.lastError?.path }}</p>
      <p v-if="state.lastError?.newPath">New path: {{ state.lastError.newPath }}</p>
      <p>Time: {{ formattedErrorTime }}</p>
      <p>Message: {{ state.lastError?.message }}</p>
    </div>

    <div class="save-status-button__actions">
      <MDButton color="text" label="Dismiss" @click="onClickDismissError" />
      <MDButton
        color="text"
        label="Copy details"
        :disabled="!errorDetails"
        @click="onClickCopyDetails"
      />
    </div>
  </MDOverlayTooltip>
</template>

<style scoped>
.save-status-button__icon_error {
  --md-content-color: var(--md-sys-color-error);
}

.save-status-button__tooltip {
  display: grid;
  gap: 8px;
  max-width: 480px;
}

.save-status-button__actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
