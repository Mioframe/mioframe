<script setup lang="ts">
import { computed } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { useDiagnosticsErrorPrompt } from './useDiagnosticsErrorPrompt';
import type { DiagnosticsPromptPlacement } from './useDiagnosticsErrorPromptState';

const props = defineProps<{
  /** Local render target this prompt instance belongs to; only drives copy and actions here. */
  placement: DiagnosticsPromptPlacement;
}>();

const { enableDiagnostics, dismiss } = useDiagnosticsErrorPrompt(() => props.placement);

const COPY: Record<DiagnosticsPromptPlacement, { headline: string; body: string }> = {
  inline: {
    headline: 'Help fix this problem?',
    body: 'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
  },
  home: {
    headline: 'Help fix recent problems?',
    body: 'Enable diagnostics to send technical error reports when something breaks. Your documents, file names, folder paths and document IDs are not sent.',
  },
};

const copy = computed(() => COPY[props.placement]);
</script>

<template>
  <MDCard variant="outlined" class="diagnostics-error-prompt">
    <p class="diagnostics-error-prompt__headline">{{ copy.headline }}</p>
    <p class="diagnostics-error-prompt__body">{{ copy.body }}</p>
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
