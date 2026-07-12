<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ZipImportProgress, ZipImportSummary } from '@shared/service';
import type { ImportZipVisibleDialogState } from './useImportZipAction';

const props = defineProps<{
  /**
   * Current import dialog lifecycle state: running, conflicts, success, partial, or error. Never
   * `idle`.
   */
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
    case 'conflicts':
      return 'Files already exist';
    case 'success':
      return 'ZIP archive imported';
    case 'partial':
      return 'Import stopped before completion';
    case 'error':
      return 'Could not import ZIP archive';
    default:
      return assertExhaustiveState(props.state);
  }
});

/**
 * Formats a count with a singular/plural noun, e.g. `1 file` or `2 files`.
 * @param count - Number of items.
 * @param noun - Singular form of the noun.
 * @returns The formatted `count noun`/`count nouns` phrase.
 */
const formatCount = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/**
 * Builds the human-readable parts of a ZIP import summary, omitting zero counts.
 * @param summary - Completed or partial import summary counts.
 * @returns Non-empty summary phrases such as `"2 files imported"`.
 */
const formatSummaryParts = (summary: ZipImportSummary): string[] =>
  [
    summary.importedFiles > 0
      ? `${formatCount(summary.importedFiles, 'file')} imported`
      : undefined,
    summary.createdDirectories > 0
      ? `${formatCount(summary.createdDirectories, 'folder')} created`
      : undefined,
    summary.reusedDirectories > 0
      ? `${formatCount(summary.reusedDirectories, 'existing folder')} reused`
      : undefined,
  ].filter((part): part is string => part !== undefined);

const supportingText = computed(() => {
  switch (props.state.status) {
    case 'running':
      return PHASE_LABELS[props.state.progress?.phase ?? 'validatingArchive'];
    case 'conflicts': {
      const { total } = props.state;
      const entryPhrase = total === 1 ? '1 archive entry' : `${total} archive entries`;
      const verb = total === 1 ? 'conflicts' : 'conflict';
      const targetPhrase = total === 1 ? 'an existing entry' : 'existing entries';
      return `${entryPhrase} ${verb} with ${targetPhrase}. No files were written. Import into an empty or different target directory.`;
    }
    case 'success': {
      const parts = formatSummaryParts(props.state.summary);
      return parts.length > 0
        ? `Import completed. ${parts.join(', ')}.`
        : 'Import completed. The archive was empty.';
    }
    case 'partial': {
      const parts = formatSummaryParts(props.state.summary);
      const completedText =
        parts.length > 0
          ? `Completed before stopping: ${parts.join(', ')}.`
          : 'No completed writes were recorded before the import stopped.';
      return `${completedText} The failed storage operation may still have changed the target directory. Retry only in a new empty target directory.`;
    }
    case 'error':
      return props.state.message;
    default:
      return assertExhaustiveState(props.state);
  }
});

const applyLabel = computed(() => {
  const { status } = props.state;
  return status === 'error' || status === 'partial' || status === 'conflicts' ? 'Close' : 'Done';
});

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
