<script setup lang="ts">
import { computed } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { useHomeDiagnosticsErrorPrompt } from './useHomeDiagnosticsErrorPrompt';

/** Copy variant for this prompt instance. Drives only copy here, not visibility routing. */
export type DiagnosticsErrorPromptVariant = 'inline' | 'home';

const props = defineProps<{
  variant: DiagnosticsErrorPromptVariant;
}>();

const emit = defineEmits<{
  /** The user enabled diagnostics from this prompt instance. */
  enabled: [];
  /** The user dismissed this prompt instance. */
  dismissed: [];
}>();

const { enableDiagnostics, dismiss } = useHomeDiagnosticsErrorPrompt();

const COPY: Record<DiagnosticsErrorPromptVariant, { headline: string; body: string }> = {
  inline: {
    headline: 'Help fix this problem?',
    body: 'Enable diagnostics to send technical error reports. Your documents and file paths are not sent.',
  },
  home: {
    headline: 'Help fix recent problems?',
    body: 'Enable diagnostics to send technical error reports when something breaks. Your documents, file names, folder paths and document IDs are not sent.',
  },
};

const copy = computed(() => COPY[props.variant]);

const onEnable = () => {
  enableDiagnostics();
  emit('enabled');
};

const onDismiss = () => {
  dismiss();
  emit('dismissed');
};
</script>

<template>
  <MDCard variant="outlined" class="diagnostics-error-prompt">
    <p class="diagnostics-error-prompt__headline">{{ copy.headline }}</p>
    <p class="diagnostics-error-prompt__body">{{ copy.body }}</p>
    <div class="diagnostics-error-prompt__actions">
      <MDButton color="text" label="Not now" @click="onDismiss" />
      <MDButton color="filled" label="Enable diagnostics" @click="onEnable" />
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
