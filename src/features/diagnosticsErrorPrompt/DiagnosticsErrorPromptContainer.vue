<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { useDiagnosticsErrorPrompt } from './useDiagnosticsErrorPrompt';

const { isVisible, enableDiagnostics, dismiss } = useDiagnosticsErrorPrompt();

const targetTeleport = useClosestParentFrame();

const promptContainer = useTemplateRef('promptContainer');
</script>

<template>
  <TeleportContainer :to="targetTeleport" :container="promptContainer">
    <div ref="promptContainer" class="diagnostics-error-prompt-container">
      <MDCard v-if="isVisible" variant="elevated" class="diagnostics-error-prompt-container__card">
        <p class="diagnostics-error-prompt-container__headline">Help fix this problem?</p>
        <p class="diagnostics-error-prompt-container__body">
          Enable diagnostics to send technical error reports. Your documents and file paths are not
          sent.
        </p>
        <div class="diagnostics-error-prompt-container__actions">
          <MDButton color="text" label="Not now" @click="dismiss" />
          <MDButton color="text" label="Enable diagnostics" @click="enableDiagnostics" />
        </div>
      </MDCard>
    </div>
  </TeleportContainer>
</template>

<style scoped>
.diagnostics-error-prompt-container {
  position: fixed;
  z-index: 2;
  left: 16px;
  right: 16px;
  bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: flex-end;
  pointer-events: none;

  &__card {
    width: 100%;
    max-width: 360px;
    pointer-events: all;
  }

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
