<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ExportZipDialogProgress } from './useExportDirectoryZip';

const props = defineProps<{
  /** Current export progress, or `undefined` before the first phase is reported. */
  progress?: ExportZipDialogProgress | undefined;
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
</script>

<template>
  <MDDialog
    headline="Exporting ZIP archive"
    :supporting-text="phaseLabel"
    apply-label="Done"
    :has-cancel-action="false"
    :loading="true"
  >
    <div class="export-zip-progress-sheet__body">
      <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
      <p
        v-if="progressCountLabel"
        class="export-zip-progress-sheet__count"
        :class="MD_TYPESCALE.body.medium"
      >
        {{ progressCountLabel }}
      </p>
    </div>
  </MDDialog>
</template>

<style scoped>
.export-zip-progress-sheet__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
