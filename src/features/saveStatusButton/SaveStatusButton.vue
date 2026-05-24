<script setup lang="ts">
import { useVfsActivity } from '@entity/vfsActivity';
import { useMainServiceClient } from '@shared/service';
import { MDButton } from '@shared/ui/Button';
import { MDAssistChip } from '@shared/ui/Chips';
import { MDSymbol } from '@shared/ui/Icon';
import { useSnackbar } from '@shared/ui/Snackbar';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import type { ComponentPublicInstance } from 'vue';
import { computed, ref, useTemplateRef } from 'vue';
import { formatSaveStatusErrorDetails, STATUS_LABELS } from './saveStatusText';

const triggerRef = useTemplateRef<ComponentPublicInstance>('triggerRef');
const showErrorDetails = ref(false);
const { addSnackbar } = useSnackbar();
const {
  fileSystem: { acknowledgeVfsActivityError: dismissSaveStatusError },
} = useMainServiceClient();
const { hasUnacknowledgedError, state } = useVfsActivity();

const isError = computed(() => state.value.status === 'error');
const isActive = computed(() => state.value.status === 'active');
const label = computed(() =>
  state.value.status === 'idle' ? undefined : STATUS_LABELS[state.value.status],
);
const errorDetails = computed(() => formatSaveStatusErrorDetails(state.value.lastError));

const onClickTrigger = () => {
  if (state.value.status === 'idle') {
    return;
  }

  showErrorDetails.value = true;
};

const onClickDismissError = () => {
  dismissSaveStatusError();
  showErrorDetails.value = false;
};

const onClickCloseDetails = () => {
  showErrorDetails.value = false;
};

const detailActionLabel = computed(() => (isError.value ? 'Dismiss' : 'Close'));

const onClickDetailAction = () => {
  if (isError.value) {
    onClickDismissError();
    return;
  }

  onClickCloseDetails();
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

const onInteractionOutside = () => {
  showErrorDetails.value = false;
};
</script>

<template>
  <MDAssistChip v-if="label" ref="triggerRef" :label="label" @click="onClickTrigger">
    <template #leadingIcon>
      <MDSymbol
        :name="isError ? 'error' : 'sync'"
        :class="{ 'save-status-button__icon_error': isError }"
      />
    </template>
  </MDAssistChip>

  <MDOverlayTooltip
    v-if="isActive || (isError && hasUnacknowledgedError)"
    :show="showErrorDetails"
    :target-element="triggerRef"
    @interaction-outside="onInteractionOutside"
  >
    <div class="save-status-button__tooltip">
      <template v-if="isActive">
        <p>Changes are still being saved.</p>
        <p>Keep this folder open until saving finishes.</p>
      </template>

      <template v-else>
        <p>Could not confirm the last save.</p>
        <p>Check this folder and retry if data should have changed.</p>
      </template>
    </div>

    <div class="save-status-button__actions">
      <MDButton color="text" :label="detailActionLabel" @click="onClickDetailAction" />
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
