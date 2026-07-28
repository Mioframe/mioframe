declare global {
  interface Window {
    /** Defined by the publisher-injected boot watchdog script, when active. */
    mioframeAppUpdateBootOk?: () => void;
  }
}

/**
 * Reports successful application bootstrap to the publisher-injected boot
 * watchdog, if one is active for this channel. A no-op otherwise (e.g.
 * local development, or a channel without the managed controller worker) —
 * the watchdog owns all boot-confirmation and rollback decisions; this call
 * only relays the one fact it needs.
 */
export function reportAppBootOk(): void {
  window.mioframeAppUpdateBootOk?.();
}
