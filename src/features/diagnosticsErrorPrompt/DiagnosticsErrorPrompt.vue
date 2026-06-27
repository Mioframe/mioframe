<script setup lang="ts">
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { useDiagnosticsErrorPrompt } from './useDiagnosticsErrorPrompt';

const { enableDiagnostics, dismiss } = useDiagnosticsErrorPrompt();
</script>

<template>
  <MDCard variant="outlined" class="diagnostics-error-prompt">
    <p class="diagnostics-error-prompt__headline">Help fix this problem?</p>
    <p class="diagnostics-error-prompt__body">
      Enable diagnostics to send technical error reports. Your documents and file paths are not
      sent.
    </p>
    <div class="diagnostics-error-prompt__actions">
      <MDButton color="text" label="Not now" @click="dismiss" />
      <MDButton color="filled" label="Enable diagnostics" @click="enableDiagnostics" />
    </div>
  </MDCard>
</template>

<style scoped>
.diagnostics-error-prompt {
  &__headline {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  }

  &__body {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
