type RuntimeEffects = {
  flush: () => void;
  clear: () => void;
};

const registeredEffects: RuntimeEffects[] = [];

/**
 * Registers a pair of flush/clear queue side effects for the shared diagnostics runtime.
 * Each diagnostics transport module calls this once at import time so
 * `setDiagnosticsRuntimeState` can drive all queues without importing transport modules.
 * @param effects - The flush and clear callbacks to register.
 */
export const registerDiagnosticsRuntimeEffects = (effects: RuntimeEffects): void => {
  registeredEffects.push(effects);
};

/**
 * Calls all registered flush effects.
 * Invoked by `setDiagnosticsRuntimeState` when reporting becomes `enabled`.
 */
export const flushDiagnosticsRuntimeEffects = (): void => {
  for (const effects of registeredEffects) {
    effects.flush();
  }
};

/**
 * Calls all registered clear effects.
 * Invoked by `setDiagnosticsRuntimeState` when reporting becomes `disabled`.
 */
export const clearDiagnosticsRuntimeEffects = (): void => {
  for (const effects of registeredEffects) {
    effects.clear();
  }
};
