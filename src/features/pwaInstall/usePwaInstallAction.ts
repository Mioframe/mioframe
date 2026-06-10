import { computed } from 'vue';
import { useLocalSettings } from '@entity/localSettings';
import { detectBrowserPlatform, selectInstallGuideUrl } from '@shared/lib/pwaInstall';
import { usePwaInstallRuntime } from './pwaInstallRuntime';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Exposes the current PWA install action state and user actions.
 * Safe to call from multiple components — shares global runtime state.
 * @returns Install action state and action handlers.
 */
export const usePwaInstallAction = () => {
  const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();
  const { settings } = useLocalSettings();

  /** Whether the browser has provided a retained install prompt. */
  const hasRetainedPrompt = computed(() => retainedPrompt.value !== null);

  /** Whether the home install widget should be visible. */
  const isHomeWidgetVisible = computed(() => {
    if (isInstalledForSession.value) return false;
    const dismissedUntil = settings.value.pwaInstallWidgetDismissedUntil;
    if (dismissedUntil !== undefined && Date.now() < dismissedUntil) return false;
    return true;
  });

  /** Whether the settings install entry should be visible. */
  const isSettingsEntryVisible = computed(() => !isInstalledForSession.value);

  /**
   * Runs the primary install action:
   * calls the retained browser prompt if available, otherwise opens the external guide.
   * Must be called directly from a user interaction handler.
   */
  const runInstallAction = async (): Promise<void> => {
    const prompt = retainedPrompt.value;
    if (prompt) {
      retainedPrompt.value = null;
      await prompt.prompt();
      return;
    }
    const url = selectInstallGuideUrl(detectBrowserPlatform(navigator.userAgent));
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  /** Hides the home install widget for 30 days. Does not affect the settings entry. */
  const dismissHomeWidget = (): void => {
    settings.value.pwaInstallWidgetDismissedUntil = Date.now() + THIRTY_DAYS_MS;
  };

  return {
    hasRetainedPrompt,
    isHomeWidgetVisible,
    isSettingsEntryVisible,
    runInstallAction,
    dismissHomeWidget,
  };
};
