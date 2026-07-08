<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ZipImportProgress } from '@shared/service';
import type { ImportZipDialogState } from './useImportZipAction';

const props = defineProps<{
  /** Current import dialog lifecycle state: running, success, or error. */
  state: ImportZipDialogState;
}>();

const emit = defineEmits<{
  close: [];
}>();

const PHASE_LABELS: Record<ZipImportProgress['phase'], string> = {
  validatingArchive: 'Validating archive…',
  checkingConflicts: 'Checking for conflicts…',
  unpacking: 'Writing files…',
};

const headline = computed(() => {
  switch (props.state.status) {
    case 'success':
      return 'ZIP archive imported';
    case 'error':
      return 'Could not import ZIP archive';
    default:
      return 'Importing ZIP archive';
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
      return '';
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
    <div v-if="state.status === 'running'" class="import-zip-progress-sheet__body">
      <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
      <p
        v-if="progressCountLabel"
        class="import-zip-progress-sheet__count"
        :class="MD_TYPESCALE.body.medium"
      >
        {{ progressCountLabel }}
      </p>
    </div>
  </MDDialog>
</template>

<style scoped>
.import-zip-progress-sheet__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
