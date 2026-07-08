<script setup lang="ts">
import { computed } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDDialog } from '@shared/ui/Dialog';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import type { ZipImportProgress } from '@shared/service';

const props = defineProps<{
  /** Current import progress, or `undefined` before the first phase is reported. */
  progress?: ZipImportProgress | undefined;
}>();

const PHASE_LABELS: Record<ZipImportProgress['phase'], string> = {
  validatingArchive: 'Validating archive…',
  checkingConflicts: 'Checking for conflicts…',
  unpacking: 'Writing files…',
};

const phaseLabel = computed(() => PHASE_LABELS[props.progress?.phase ?? 'validatingArchive']);

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
    headline="Importing ZIP archive"
    :supporting-text="phaseLabel"
    apply-label="Done"
    :has-cancel-action="false"
    :loading="true"
  >
    <div class="import-zip-progress-sheet__body">
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
