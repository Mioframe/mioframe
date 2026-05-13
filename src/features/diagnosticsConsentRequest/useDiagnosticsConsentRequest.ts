import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import { useDialog } from '@shared/ui/Dialog';
import { watch } from 'vue';

let diagnosticsConsentHandledThisSession = false;

/**
 * Requests diagnostics consent once after local settings finish hydrating.
 */
export const useDiagnosticsConsentRequest = () => {
  const { isFinished } = useLocalSettings();
  const { acceptDiagnosticsConsent, diagnosticsConsentRequested, rejectDiagnosticsConsent } =
    useDiagnosticsSettings();
  const { confirm } = useDialog();

  watch(
    [isFinished, diagnosticsConsentRequested],
    () => {
      if (!SENTRY_DIAGNOSTICS_AVAILABLE || !isFinished.value) {
        return;
      }

      if (diagnosticsConsentHandledThisSession || diagnosticsConsentRequested.value) {
        return;
      }

      diagnosticsConsentHandledThisSession = true;

      void (async () => {
        const diagnosticsEnabled = await confirm({
          headline: 'Help improve Mioframe?',
          supportingText:
            'Mioframe can send technical error reports when something breaks. This helps developers find and fix crashes. Reports do not include document contents, record values, document names, folder names, local folder paths, document ids, or file ids.',
          confirmLabel: 'Allow',
          cancelLabel: 'Not now',
        });

        if (diagnosticsEnabled) {
          acceptDiagnosticsConsent();
          return;
        }

        rejectDiagnosticsConsent();
      })();
    },
    { immediate: true },
  );
};
