import {
  DIAGNOSTICS_POLICY_SYNC_MESSAGE_TYPE,
  type DiagnosticsPolicySyncMessage,
} from '@shared/lib/diagnostics/diagnosticsPolicySyncMessage';
import type { SentryRuntimeState } from '@shared/lib/diagnostics/sentryRuntimeState';

/**
 * Pushes current diagnostics runtime state (session ID + reporting state) from the
 * main thread to this page's controlling managed Service Worker, so an already-running
 * worker applies a consent change immediately instead of waiting for its next restart.
 *
 * A no-op without `serviceWorker` support or a controller (e.g. an unmanaged build, or
 * before this page is ever controlled). Fire-and-forget: never throws into product code,
 * and never waits for or expects a response — this message belongs to diagnostics
 * infrastructure, not the managed-update protocol.
 * @param state - The state to sync to the managed Service Worker.
 */
export const syncDiagnosticsPolicyToManagedServiceWorker = (state: SentryRuntimeState): void => {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  let controller: ServiceWorker | null | undefined;
  try {
    controller = navigator.serviceWorker.controller;
  } catch {
    return;
  }
  if (!controller) return;

  const message: DiagnosticsPolicySyncMessage = {
    type: DIAGNOSTICS_POLICY_SYNC_MESSAGE_TYPE,
    reportingState: state.reportingState,
    sessionId: state.sessionId,
  };

  try {
    controller.postMessage(message);
  } catch {
    // Fire-and-forget: transport failures must never propagate into product code.
  }
};
