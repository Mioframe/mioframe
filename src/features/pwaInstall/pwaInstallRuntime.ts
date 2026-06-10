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

// Module-level references so repeated setup calls can remove previous listeners.
let registeredBeforeInstallPrompt: ((event: BeforeInstallPromptEvent) => void) | null = null;
let registeredAppInstalled: (() => void) | null = null;

/**
 * Subscribes to browser install events. Safe to call more than once —
 * previous listeners are removed before new ones are added.
 */
export const setupPwaInstallRuntime = (): void => {
  if (registeredBeforeInstallPrompt) {
    window.removeEventListener('beforeinstallprompt', registeredBeforeInstallPrompt);
  }
  if (registeredAppInstalled) {
    window.removeEventListener('appinstalled', registeredAppInstalled);
  }

  const { retainedPrompt, isInstalledForSession } = usePwaInstallRuntime();

  registeredBeforeInstallPrompt = (event: BeforeInstallPromptEvent) => {
    event.preventDefault();
    retainedPrompt.value = event;
  };

  registeredAppInstalled = () => {
    retainedPrompt.value = null;
    isInstalledForSession.value = true;
  };

  window.addEventListener('beforeinstallprompt', registeredBeforeInstallPrompt);
  window.addEventListener('appinstalled', registeredAppInstalled);
};
