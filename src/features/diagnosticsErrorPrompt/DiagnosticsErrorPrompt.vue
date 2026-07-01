<script setup lang="ts">
import { computed } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { useDiagnosticsErrorPromptEligibility } from './useDiagnosticsErrorPromptEligibility';

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

const { enableDiagnosticsFromPrompt, dismissDiagnosticsPrompt } =
  useDiagnosticsErrorPromptEligibility();

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
  enableDiagnosticsFromPrompt();
  emit('enabled');
};

const onDismiss = () => {
  dismissDiagnosticsPrompt();
  emit('dismissed');
};
</script>

<template>
  <MDCard variant="outlined" class="diagnostics-error-prompt">
    <p class="diagnostics-error-prompt__headline md-typescale-title-medium">{{ copy.headline }}</p>
    <p class="diagnostics-error-prompt__body md-typescale-body-medium">{{ copy.body }}</p>
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
  }

  &__body {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
