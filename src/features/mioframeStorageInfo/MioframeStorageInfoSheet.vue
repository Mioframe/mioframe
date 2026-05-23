<script setup lang="ts">
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

const emit = defineEmits<{
  close: [];
}>();

const onClose = () => {
  emit('close');
};
</script>

<template>
  <MDBottomSheet label="How Mioframe documents are stored" @closed="onClose">
    <MDBottomSheetSection class="mioframe-storage-info-sheet">
      <h2 class="mioframe-storage-info-sheet__title">How Mioframe documents are stored</h2>

      <div class="mioframe-storage-info-sheet__content">
        <p>Mioframe shows its documents separately from ordinary files in the same folder.</p>
        <p>Service files are hidden from the file list by default.</p>
        <p>Those files are required for saving, history, and recovery.</p>
        <p>You normally should not open or change those files by hand.</p>
        <p>To move or back up a Mioframe space, copy the whole folder.</p>
      </div>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style scoped>
.mioframe-storage-info-sheet {
  padding: 0 16px 24px;
  gap: 16px;
}

.mioframe-storage-info-sheet__title {
  margin: 0;
  font-family: var(--md-sys-typescale-headline-small-font);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}

.mioframe-storage-info-sheet__content {
  display: grid;
  gap: 12px;
  color: var(--md-sys-color-on-surface-variant);
}

.mioframe-storage-info-sheet__content p {
  margin: 0;
}
</style>
