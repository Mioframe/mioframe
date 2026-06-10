import { createGlobalState, useEventListener } from '@vueuse/core';
import { shallowRef } from 'vue';
import { isStandaloneMode } from '@shared/lib/pwaInstall';

/**
 * Global in-memory install runtime state.
 * The retained BeforeInstallPromptEvent never leaves this module.
 */
export const usePwaInstallRuntime = createGlobalState(() => {
  const retainedPrompt = shallowRef<BeforeInstallPromptEvent | null>(null);
  const isInstalledForSession = shallowRef(isStandaloneMode());
  return { retainedPrompt, isInstalledForSession };
});

let stopListeners: (() => void) | null = null;

/**
 * Subscribes to browser install events. Safe to call more than once —
 * previous listeners are removed before new ones are added.
 */
export const setupPwaInstallRuntime = (): void => {
  stopListeners?.();

  const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();

  const stopBefore = useEventListener(window, 'beforeinstallprompt', (event) => {
    event.preventDefault();
    retainedPrompt.value = event;
  });

  const stopApp = useEventListener(window, 'appinstalled', () => {
    retainedPrompt.value = null;
    isInstalledForSession.value = true;
  });

  stopListeners = () => {
    stopBefore();
    stopApp();
  };
};
