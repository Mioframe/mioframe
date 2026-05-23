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
import { formatSaveStatusErrorDetails } from './saveStatusText';

const triggerRef = useTemplateRef<ComponentPublicInstance>('triggerRef');
const showErrorDetails = ref(false);
const { addSnackbar } = useSnackbar();
const {
  fileSystem: { acknowledgeVfsActivityError: dismissSaveStatusError },
} = useMainServiceClient();
const { hasUnacknowledgedError, state } = useVfsActivity();

const isError = computed(() => state.value.status === 'error');
const label = computed(() => {
  if (state.value.status === 'active') {
    return 'Сохраняем';
  }

  if (state.value.status === 'error') {
    return 'Ошибка';
  }

  return undefined;
});
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
  <MDAssistChip v-if="label" ref="triggerRef" :label="label" @click="onClickTrigger">
    <template #leadingIcon>
      <MDSymbol
        :name="isError ? 'error' : 'sync'"
        :class="{ 'save-status-button__icon_error': isError }"
      />
    </template>
  </MDAssistChip>

  <MDOverlayTooltip
    v-if="isError && hasUnacknowledgedError"
    :show="showErrorDetails"
    :target-element="triggerRef"
    @interaction-outside="onInteractionOutside"
  >
    <div class="save-status-button__tooltip">
      <p>Не удалось подтвердить последнее сохранение.</p>
      <p>Проверьте папку и повторите действие, если данные должны были измениться.</p>
    </div>

    <div class="save-status-button__actions">
      <MDButton color="text" label="Закрыть" @click="onClickDismissError" />
      <MDButton
        color="text"
        label="Скопировать детали"
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
