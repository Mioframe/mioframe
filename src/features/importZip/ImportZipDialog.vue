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
  skipExisting: [];
  verifyAndContinue: [];
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
    case 'conflicts':
      return 'Files already exist';
    case 'success':
      return 'ZIP archive imported';
    case 'partial':
      return 'Import stopped before completion';
    case 'recoveryUnresolved':
      return 'Import recovery needs a new folder';
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
    case 'conflicts':
      return `${props.state.total} archive entries conflict with existing files. No files were written.`;
    case 'success':
      return `Import completed. ${[
        props.state.summary.importedFiles > 0
          ? `${props.state.summary.importedFiles} files imported`
          : undefined,
        props.state.summary.verifiedFiles > 0
          ? `${props.state.summary.verifiedFiles} files verified`
          : undefined,
        props.state.summary.skippedFiles > 0
          ? `${props.state.summary.skippedFiles} existing files skipped`
          : undefined,
      ]
        .filter(Boolean)
        .join(', ')}.`;
    case 'partial':
      return 'A provider operation may have changed one target entry. Mioframe must verify it against the archive before continuing.';
    case 'recoveryUnresolved':
      return props.state.reason === 'contentMismatch'
        ? `The existing file "${props.state.relativePath}" differs from the archive. Mioframe did not overwrite it. Import into an empty folder to recover safely.`
        : `The existing path "${props.state.relativePath}" has the wrong type. Mioframe did not overwrite or delete it. Import into an empty folder to recover safely.`;
    case 'error':
      return props.state.message;
    default:
      return assertExhaustiveState(props.state);
  }
});

const applyLabel = computed(() => {
  if (props.state.status === 'conflicts') return 'Skip existing';
  if (props.state.status === 'partial') return 'Verify and continue';
  return props.state.status === 'error' || props.state.status === 'recoveryUnresolved'
    ? 'Close'
    : 'Done';
});

const cancelLabel = computed(() =>
  props.state.status === 'conflicts'
    ? 'Cancel'
    : props.state.status === 'partial'
      ? 'Close'
      : undefined,
);

const hasCancelAction = computed(
  () => props.state.status === 'conflicts' || props.state.status === 'partial',
);

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

  if (props.state.status === 'conflicts') emit('skipExisting');
  else if (props.state.status === 'partial') emit('verifyAndContinue');
  else emit('close');
};

const onCancel = () => {
  emit('close');
};
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    :cancel-label="cancelLabel"
    :apply-label="applyLabel"
    :has-cancel-action="hasCancelAction"
    :loading="isLoading"
    @apply="onApply"
    @cancel="onCancel"
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
    <ul v-if="state.status === 'conflicts'" class="import-zip-dialog__conflicts">
      <li v-for="path in state.paths" :key="path">{{ path }}</li>
      <li v-if="state.truncated">Additional conflicting entries are not shown.</li>
    </ul>
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
