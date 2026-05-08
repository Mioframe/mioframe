<script setup lang="ts">
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MDPane class="data-storage-privacy-pane" allow-bottom-navigation>
    <MDAppBar headline="Data storage and privacy">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="data-storage-privacy-pane__content">
      <section class="data-storage-privacy-pane__section" aria-labelledby="local-first-heading">
        <h2 id="local-first-heading" class="data-storage-privacy-pane__title">
          Local-first by default
        </h2>
        <p>Mioframe 0.1 is local-first. You can use the app without creating a Mioframe account.</p>
      </section>

      <section class="data-storage-privacy-pane__section" aria-labelledby="storage-heading">
        <h2 id="storage-heading" class="data-storage-privacy-pane__title">
          Where your data is stored
        </h2>
        <p>Documents are stored in browser storage or in folders that you explicitly choose.</p>
      </section>

      <section class="data-storage-privacy-pane__section" aria-labelledby="google-drive-heading">
        <h2 id="google-drive-heading" class="data-storage-privacy-pane__title">Google Drive</h2>
        <p>
          Google Drive is optional and is used only after you enable the integration and connect a
          Google account.
        </p>
        <p>
          Turning off Google Drive in Settings only disables the integration inside this app. It
          does not revoke access from Google.
        </p>
      </section>

      <section class="data-storage-privacy-pane__section" aria-labelledby="diagnostics-heading">
        <h2 id="diagnostics-heading" class="data-storage-privacy-pane__title">Error diagnostics</h2>
        <p>
          Error diagnostics are optional. Mioframe can send technical error reports when something
          breaks so developers can investigate crashes and unexpected failures.
        </p>
        <p>
          You can enable or disable error diagnostics in Settings at any time. Document contents are
          not intentionally included in these reports.
        </p>
        <p>
          Technical reports may still include metadata such as stack traces, browser details, or the
          current app URL when an error happens.
        </p>
      </section>
    </div>
  </MDPane>
</template>

<style scoped>
.data-storage-privacy-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.data-storage-privacy-pane__content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 16px;
}

.data-storage-privacy-pane__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.data-storage-privacy-pane__title {
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
