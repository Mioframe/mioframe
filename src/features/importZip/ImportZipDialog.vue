<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ZipImportProgress } from '@shared/service';
import type { ImportZipVisibleDialogState } from './useImportZipAction';

const props = defineProps<{
  /** Current import dialog lifecycle state: running, success, or error. Never `idle`. */
  state: ImportZipVisibleDialogState;
}>();

const emit = defineEmits<{
  close: [];
}>();

const PHASE_LABELS: Record<ZipImportProgress['phase'], string> = {
  validatingArchive: 'Validating archive…',
  checkingConflicts: 'Checking for conflicts…',
  unpacking: 'Writing files…',
};

/**
 * Exhaustiveness guard so a future visible state can't silently fall through to an empty render.
 * @param state - The unreachable state value, used only to prove exhaustiveness.
 */
const assertExhaustiveState = (state: never): never => {
  throw new Error(`Unhandled import ZIP dialog state: ${String(state)}`);
};

const headline = computed(() => {
  switch (props.state.status) {
    case 'running':
      return 'Importing ZIP archive';
    case 'success':
      return 'ZIP archive imported';
    case 'error':
      return 'Could not import ZIP archive';
    default:
      return assertExhaustiveState(props.state);
  }
});

const supportingText = computed(() => {
  switch (props.state.status) {
    case 'running':
      return PHASE_LABELS[props.state.progress?.phase ?? 'validatingArchive'];
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
    <div v-if="state.status === 'running'" class="import-zip-dialog__body">
      <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
      <p
        v-if="progressCountLabel"
        class="import-zip-dialog__count"
        :class="MD_TYPESCALE.body.medium"
      >
        {{ progressCountLabel }}
      </p>
    </div>
  </MDDialog>
</template>

<style scoped>
.import-zip-dialog__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
