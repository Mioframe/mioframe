<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/ui/material';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ExportZipDialogPhase, ExportZipVisibleDialogState } from './useExportDirectoryZip';

const props = defineProps<{
  /** Current export dialog lifecycle state: running, success, or error. Never `idle`. */
  state: ExportZipVisibleDialogState;
}>();

const emit = defineEmits<{
  close: [];
}>();

const PHASE_LABELS: Record<ExportZipDialogPhase, string> = {
  preparing: 'Preparing export…',
  reading: 'Reading files…',
  packing: 'Packing archive…',
  saving: 'Saving archive…',
};

/**
 * Exhaustiveness guard so a future visible state can't silently fall through to an empty render.
 * @param state - The unreachable state value, used only to prove exhaustiveness.
 */
const assertExhaustiveState = (state: never): never => {
  throw new Error(`Unhandled export ZIP dialog state: ${String(state)}`);
};

const headline = computed(() => {
  switch (props.state.status) {
    case 'running':
      return 'Exporting ZIP archive';
    case 'success':
      return 'ZIP archive exported';
    case 'error':
      return 'Could not export ZIP archive';
    default:
      return assertExhaustiveState(props.state);
  }
});

const supportingText = computed(() => {
  switch (props.state.status) {
    case 'running':
      return PHASE_LABELS[props.state.progress?.phase ?? 'preparing'];
    case 'success':
    case 'error':
      return props.state.message;
    default:
      return assertExhaustiveState(props.state);
  }
});

const applyLabel = computed(() => (props.state.status === 'error' ? 'Close' : 'Done'));

const isLoading = computed(() => props.state.status === 'running');

const progressCountLabel = computed(() => {
  if (props.state.status !== 'running') {
    return undefined;
  }

  const { current, total } = props.state.progress ?? {};
  return current !== undefined && total !== undefined ? `${current} / ${total}` : undefined;
});

const progressFraction = computed(() => {
  if (props.state.status !== 'running') {
    return 0;
  }

  const { current, total } = props.state.progress ?? {};
  return current !== undefined && total !== undefined && total > 0 ? current / total : 0;
});

const onApply = () => {
  if (props.state.status === 'running') {
    return;
  }

  emit('close');
};
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    :apply-label="applyLabel"
    :has-cancel-action="false"
    :loading="isLoading"
    @apply="onApply"
  >
    <div v-if="state.status === 'running'" class="export-zip-dialog__body">
      <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
      <p
        v-if="progressCountLabel"
        class="export-zip-dialog__count"
        :class="MD_TYPESCALE.body.medium"
      >
        {{ progressCountLabel }}
      </p>
    </div>
  </MDDialog>
</template>

<style scoped>
.export-zip-dialog__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
