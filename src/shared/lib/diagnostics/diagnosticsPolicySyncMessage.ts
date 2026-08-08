import * as z from 'zod/v4-mini';

/**
 * Discriminant for the diagnostics-policy live-sync message a window client sends
 * to its controlling managed Service Worker so an already-running worker reacts
 * immediately to a diagnostics consent change, instead of waiting for its next
 * restart to re-read the persisted policy.
 *
 * Deliberately outside the managed-update private protocol
 * (`shared/service/appUpdate/protocol.ts`): this is diagnostics infrastructure, not
 * an update command, carries no updater state, and never receives a response.
 */
export const DIAGNOSTICS_POLICY_SYNC_MESSAGE_TYPE = 'DIAGNOSTICS_POLICY_SYNC' as const;

/**
 * Runtime-validated shape of the diagnostics-policy live-sync message. Carries only
 * the already-existing safe runtime state (`reportingState`, `sessionId`) — the exact
 * same shape `SentryRuntimeState` already has.
 */
export const zodDiagnosticsPolicySyncMessage = z.object({
  type: z.literal(DIAGNOSTICS_POLICY_SYNC_MESSAGE_TYPE),
  reportingState: z.enum(['unknown', 'enabled', 'disabled']),
  sessionId: z.string(),
});
/** A {@link zodDiagnosticsPolicySyncMessage}-validated diagnostics-policy sync message. */
export type DiagnosticsPolicySyncMessage = z.infer<typeof zodDiagnosticsPolicySyncMessage>;
