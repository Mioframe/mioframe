<script setup lang="ts">
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MDPane class="privacy-help-pane" allow-bottom-navigation>
    <MDAppBar headline="Data storage and privacy">
      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="privacy-help-pane__content">
      <section class="privacy-help-pane__section" aria-labelledby="local-first-heading">
        <h2 id="local-first-heading" class="privacy-help-pane__title">Local-first by default</h2>
        <p>Mioframe 0.1 is local-first. You can use the app without creating a Mioframe account.</p>
      </section>

      <section class="privacy-help-pane__section" aria-labelledby="storage-heading">
        <h2 id="storage-heading" class="privacy-help-pane__title">Where your data is stored</h2>
        <p>Documents are stored in browser storage or in folders that you explicitly choose.</p>
      </section>

      <section class="privacy-help-pane__section" aria-labelledby="google-drive-heading">
        <h2 id="google-drive-heading" class="privacy-help-pane__title">Google Drive</h2>
        <p>
          Google Drive is optional and is used only after you enable the integration and connect a
          Google account.
        </p>
        <p>
          Turning off Google Drive in Settings only disables the integration inside this app. It
          does not revoke access from Google.
        </p>
      </section>
    </div>
  </MDPane>
</template>

<style scoped>
.privacy-help-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.privacy-help-pane__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

.privacy-help-pane__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.privacy-help-pane__title {
  margin: 0;
  font-family: var(--md-sys-typescale-title-medium-font);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  line-height: var(--md-sys-typescale-title-medium-line-height);
}

p {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font-family: var(--md-sys-typescale-body-large-font);
  font-size: var(--md-sys-typescale-body-large-size);
  font-weight: var(--md-sys-typescale-body-large-weight);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  line-height: var(--md-sys-typescale-body-large-line-height);
}
</style>
