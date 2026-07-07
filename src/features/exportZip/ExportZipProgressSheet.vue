<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { MD_TYPESCALE } from '@shared/lib/md';
import { useModalAriaHidden } from '@shared/ui/AriaHidden';
import { useOverlayContainer } from '@shared/ui/Overlay';
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

const overlayContainer = useOverlayContainer();
const surfaceEl = useTemplateRef<HTMLElement>('surfaceEl');
const ariaHidden = useModalAriaHidden();
</script>

<template>
  <TeleportContainer :to="overlayContainer" :container="surfaceEl">
    <div
      ref="surfaceEl"
      class="export-zip-progress-sheet"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="export-zip-progress-sheet-headline"
      :aria-hidden="ariaHidden"
    >
      <div class="export-zip-progress-sheet__surface">
        <MDCircularProgressIndicator :progress="progressFraction" :size="48" />
        <p
          id="export-zip-progress-sheet-headline"
          class="export-zip-progress-sheet__phase"
          :class="MD_TYPESCALE.body.large"
          aria-live="polite"
        >
          {{ phaseLabel }}
        </p>
        <p
          v-if="progressCountLabel"
          class="export-zip-progress-sheet__count"
          :class="MD_TYPESCALE.body.medium"
        >
          {{ progressCountLabel }}
        </p>
      </div>
    </div>
  </TeleportContainer>
</template>

<style scoped>
.export-zip-progress-sheet {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(from var(--md-sys-color-scrim) r g b / 32%);

  &__surface {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    min-width: 280px;
    max-width: min(400px, 100dvw - 32px);
    padding: 24px 16px 32px;
    border-radius: var(--md-sys-shape-corner-extra-large);
    background-color: var(--md-sys-color-surface-container-high);
    box-shadow: var(--md-sys-elevation-level3);
  }

  &__phase {
    margin: 8px 0 0;
    text-align: center;
    color: var(--md-sys-color-on-surface);
  }

  &__count {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
