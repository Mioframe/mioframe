type RuntimeEffects = {
  flush: () => void;
  clear: () => void;
};

const registeredEffects = new Map<string, RuntimeEffects>();

/**
 * Registers a pair of flush/clear queue side effects for the shared diagnostics runtime.
 * Registration is idempotent: registering the same key again replaces the previous entry.
 * Each diagnostics transport module calls this once at import time so
 * `setDiagnosticsRuntimeState` can drive all queues without importing transport modules.
 * @param key - Stable identifier for this effect pair; prevents duplicate registration.
 * @param effects - The flush and clear callbacks to register.
 */
export const registerDiagnosticsRuntimeEffects = (key: string, effects: RuntimeEffects): void => {
  registeredEffects.set(key, effects);
};

/**
 * Calls all registered flush effects.
 * Invoked by `setDiagnosticsRuntimeState` when reporting becomes `enabled`.
 */
export const flushDiagnosticsRuntimeEffects = (): void => {
  for (const effects of registeredEffects.values()) {
    effects.flush();
  }
};

/**
 * Calls all registered clear effects.
 * Invoked by `setDiagnosticsRuntimeState` when reporting becomes `disabled`.
 */
export const clearDiagnosticsRuntimeEffects = (): void => {
  for (const effects of registeredEffects.values()) {
    effects.clear();
  }
};
