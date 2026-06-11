import { tryOnScopeDispose } from '@vueuse/core';
import { computed, shallowRef, watch } from 'vue';
import { useLocalSettings } from '@entity/localSettings';
import { detectBrowserPlatform, selectInstallGuideUrl } from '@shared/lib/pwaInstall';
import { usePwaInstallRuntime } from './pwaInstallRuntime';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// setTimeout delay is a 32-bit signed integer; clamp to ~24.8 days to avoid overflow.
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

/**
 * Exposes the current PWA install action state and user actions.
 * Safe to call from multiple components — shares global runtime state.
 * @returns Install action state and action handlers.
 */
export const usePwaInstallAction = () => {
  const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();
  const { settings, isFinished } = useLocalSettings();

  /** Whether the browser has provided a retained install prompt. */
  const hasRetainedPrompt = computed(() => retainedPrompt.value !== null);

  // Reactive time reference updated by a scheduled timeout when dismissedUntil is active.
  // Prevents stale Date.now() inside computed from hiding a re-eligible widget.
  const dismissalNow = shallowRef(Date.now());
  let expirationTimer: ReturnType<typeof setTimeout> | null = null;

  // Schedules the next expiration segment for dismissedUntil, handling delays longer than
  // MAX_TIMEOUT_MS by chaining successive timer segments until the dismissal expires.
  const scheduleExpirationCheck = (dismissedUntil: number): void => {
    const remaining = dismissedUntil - Date.now();
    if (remaining <= 0) {
      dismissalNow.value = Date.now();
      return;
    }
    expirationTimer = setTimeout(
      () => {
        dismissalNow.value = Date.now();
        expirationTimer = null;
        scheduleExpirationCheck(dismissedUntil);
      },
      Math.min(remaining, MAX_TIMEOUT_MS),
    );
  };

  watch(
    () => settings.value.pwaInstallWidgetDismissedUntil,
    (dismissedUntil) => {
      if (expirationTimer !== null) {
        clearTimeout(expirationTimer);
        expirationTimer = null;
      }
      if (dismissedUntil === undefined) return;
      scheduleExpirationCheck(dismissedUntil);
    },
    { immediate: true },
  );

  tryOnScopeDispose(() => {
    if (expirationTimer !== null) {
      clearTimeout(expirationTimer);
      expirationTimer = null;
    }
  });

  /** Whether the home install widget should be visible. */
  const isHomeWidgetVisible = computed(() => {
    if (!isFinished.value) return false;
    if (isInstalledForSession.value) return false;
    const dismissedUntil = settings.value.pwaInstallWidgetDismissedUntil;
    if (dismissedUntil !== undefined && dismissalNow.value < dismissedUntil) return false;
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
      try {
        await prompt.prompt();
      } finally {
        retainedPrompt.value = null;
      }
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
