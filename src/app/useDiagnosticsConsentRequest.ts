import { useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import { useDialog } from '@shared/ui/Dialog';
import { watch } from 'vue';

let diagnosticsConsentHandledThisSession = false;

/**
 * Requests diagnostics consent once after local settings finish hydrating.
 */
export const useDiagnosticsConsentRequest = () => {
  const { settings, isFinished } = useLocalSettings();
  const { confirm } = useDialog();

  watch(
    [isFinished, () => settings.value.diagnosticsConsentRequested],
    () => {
      if (!SENTRY_DIAGNOSTICS_AVAILABLE || !isFinished.value) {
        return;
      }

      if (diagnosticsConsentHandledThisSession || settings.value.diagnosticsConsentRequested) {
        return;
      }

      diagnosticsConsentHandledThisSession = true;

      void (async () => {
        const diagnosticsEnabled = await confirm(
          'Help improve Mioframe?',
          'Mioframe can send technical error reports when something breaks. This helps developers find and fix crashes. Document contents are not intentionally included.',
          'Allow',
          undefined,
          'Not now',
        );

        settings.value.diagnosticsEnabled = diagnosticsEnabled;
        settings.value.diagnosticsConsentRequested = true;
      })();
    },
    { immediate: true },
  );
};
