<script setup lang="ts">
import { computed } from 'vue';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ExportZipDialogProgress } from './useExportDirectoryZip';

const props = defineProps<{
  /** Current export progress, or `undefined` before the first phase is reported. */
  progress?: ExportZipDialogProgress | undefined;
}>();

const emit = defineEmits<{
  /** Emitted when the user dismisses the sheet. The export itself keeps running in the background. */
  close: [];
}>();

const PHASE_LABELS: Record<ExportZipDialogProgress['phase'], string> = {
  preparing: 'Preparing export…',
  reading: 'Reading files…',
  packing: 'Packing archive…',
  saving: 'Saving archive…',
};

const phaseLabel = computed(() => PHASE_LABELS[props.progress?.phase ?? 'preparing']);

const progressCountLabel = computed(() => {
  const { current, total } = props.progress ?? {};
  return current !== undefined && total !== undefined ? `${current} / ${total}` : undefined;
});

const progressFraction = computed(() => {
  const { current, total } = props.progress ?? {};
  return current !== undefined && total !== undefined && total > 0 ? current / total : 0;
});

const onClosed = () => {
  emit('close');
};
</script>

<template>
  <MDBottomSheet label="Exporting ZIP archive" class="export-zip-progress-sheet" @closed="onClosed">
    <MDBottomSheetSection class="export-zip-progress-sheet__section">
      <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
      <p class="export-zip-progress-sheet__phase">{{ phaseLabel }}</p>
      <p v-if="progressCountLabel" class="export-zip-progress-sheet__count">
        {{ progressCountLabel }}
      </p>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.export-zip-progress-sheet__section {
  align-items: center;
  gap: 8px;
  padding: 24px 16px 32px;
}

.export-zip-progress-sheet__phase {
  margin: 8px 0 0;
  font-family: var(--md-sys-typescale-body-large-font);
  font-size: var(--md-sys-typescale-body-large-size);
  font-weight: var(--md-sys-typescale-body-large-weight);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  color: var(--md-sys-color-on-surface);
}

.export-zip-progress-sheet__count {
  margin: 0;
  font-family: var(--md-sys-typescale-body-medium-font);
  font-size: var(--md-sys-typescale-body-medium-size);
  font-weight: var(--md-sys-typescale-body-medium-weight);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
