import { createGlobalState } from '@vueuse/core';
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

/**
 * Subscribes to browser install events once at app startup.
 * Call this once from the root app component.
 */
export const setupPwaInstallRuntime = (): void => {
  const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    retainedPrompt.value = event;
  });

  window.addEventListener('appinstalled', () => {
    retainedPrompt.value = null;
    isInstalledForSession.value = true;
  });
};
