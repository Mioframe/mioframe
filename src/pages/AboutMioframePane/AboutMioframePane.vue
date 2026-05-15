<script setup lang="ts">
import { computed } from 'vue';
import { useDiagnosticsSettings } from '@entity/localSettings';
import {
  APP_BUILD_DATE,
  APP_BUILD_ID,
  APP_NAME,
  APP_VERSION,
  GOOGLE_DRIVE_INTEGRATION_AVAILABLE,
  SENTRY_DIAGNOSTICS_AVAILABLE,
} from '@shared/config';
import { dayjs } from '@shared/lib/dayjs';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDButton } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { useSnackbar } from '@shared/ui/Snackbar';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { diagnosticsEnabled } = useDiagnosticsSettings();
const { addSnackbar } = useSnackbar();

const formattedBuildDate = computed(() => dayjs(APP_BUILD_DATE).format('lll'));
const getPlatform = () => {
  const userAgentData = Reflect.get(navigator, 'userAgentData');
  if (!userAgentData || typeof userAgentData !== 'object') {
    return undefined;
  }

  const platform = Reflect.get(userAgentData, 'platform');
  return typeof platform === 'string' && platform ? platform : undefined;
};

const diagnosticsText = computed(() => {
  const diagnosticsEffectivelyEnabled =
    SENTRY_DIAGNOSTICS_AVAILABLE && diagnosticsEnabled.value === true;
  const lines = [
    `App: ${APP_NAME}`,
    `Version: ${APP_VERSION}`,
    `Build date: ${APP_BUILD_DATE}`,
    ...(APP_BUILD_ID ? [`Build id: ${APP_BUILD_ID}`] : []),
    `Diagnostics available: ${SENTRY_DIAGNOSTICS_AVAILABLE ? 'yes' : 'no'}`,
    `Diagnostics enabled: ${diagnosticsEffectivelyEnabled ? 'yes' : 'no'}`,
    `Google Drive available: ${GOOGLE_DRIVE_INTEGRATION_AVAILABLE ? 'yes' : 'no'}`,
    `Browser: ${navigator.userAgent}`,
  ];
  const platform = getPlatform();

  if (platform) {
    lines.push(`Platform: ${platform}`);
  }

  return lines.join('\n');
});

const onClickCopyDiagnostics = async () => {
  if (!('clipboard' in navigator)) {
    addSnackbar({ text: 'Clipboard is not available' });
    return;
  }

  try {
    await navigator.clipboard.writeText(diagnosticsText.value);
    addSnackbar({ text: 'Diagnostics copied' });
  } catch {
    addSnackbar({ text: 'Could not copy diagnostics' });
  }
};
</script>

<template>
  <MDPane class="about-mioframe-pane" allow-bottom-navigation>
    <MDAppBar headline="About Mioframe">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <div class="about-mioframe-pane__content">
      <section class="about-mioframe-pane__section" aria-label="About Mioframe details">
        <h2 class="about-mioframe-pane__title">{{ APP_NAME }}</h2>
        <p>Version: {{ APP_VERSION }}</p>
        <p>Build date: {{ formattedBuildDate }}</p>
        <p v-if="APP_BUILD_ID">Build: {{ APP_BUILD_ID }}</p>
      </section>

      <MDButton label="Copy diagnostics" @click="onClickCopyDiagnostics" />
    </div>
  </MDPane>
</template>

<style scoped>
.about-mioframe-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.about-mioframe-pane__content {
  display: grid;
  gap: 24px;
  padding: 16px;
}

.about-mioframe-pane__section {
  display: grid;
  gap: 12px;
}

.about-mioframe-pane__title {
  font: var(--md-sys-typescale-headline-small-font);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  font-size: var(--md-sys-typescale-headline-small-size);
  font-weight: var(--md-sys-typescale-headline-small-weight);
  letter-spacing: var(--md-sys-typescale-headline-small-tracking);
}
</style>
