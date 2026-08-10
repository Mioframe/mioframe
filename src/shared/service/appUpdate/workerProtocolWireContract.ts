/**
 * Single canonical implementation of the wire values shared by the worker
 * protocol runtime and the publisher-injected boot watchdog: protocol
 * version, the watchdog-used message-type literals, boot-acknowledgement
 * outcomes, and the watchdog's own ack-wait timeout.
 *
 * This module must stay importable directly by plain Node (no TypeScript
 * loader): it uses only erasable TypeScript syntax and ordinary
 * relative/package imports, so `scripts/pages/lib/watchdogInject.mjs` can
 * import it directly and interpolate its values into the generated inline
 * watchdog script, instead of keeping its own manually-synchronized literal
 * copies. `src/shared/service/appUpdate/protocol.ts` and `bootConfirmation.ts`
 * re-export these names for every runtime consumer.
 *
 * Runtime-only protocol schemas and updater state (request/response zod
 * schemas, non-watchdog message types, recovery result codes) are not owned
 * here — they stay in `protocol.ts`, which is not importable by plain Node.
 */

/**
 * Private protocol wire-format version, present in every request, response,
 * acknowledgement, and broadcast that crosses the UI/worker/watchdog
 * boundary. Evolves additively: existing fields and semantics never change
 * for v1, and new fields are optional for a pinned v1 consumer. An
 * incompatible change requires a new explicit version and a separate
 * architecture decision — never a negotiation or adapter layer.
 */
export const APP_UPDATE_PROTOCOL_VERSION = 1;

/**
 * Private worker protocol message-type string literals the publisher-generated
 * boot watchdog itself sends or reads. Runtime-only message types
 * (`STATE_CHANGED_BROADCAST`, `RECOVER_INSTALL_LATEST`) are not part of the
 * watchdog's own protocol surface and stay in `protocol.ts`.
 */
export const WATCHDOG_PROTOCOL_MESSAGE_TYPES = {
  BOOT_OK: 'BOOT_OK',
  BOOT_FAILED: 'BOOT_FAILED',
  GET_ACTIVATION_STATUS: 'GET_ACTIVATION_STATUS',
  ROLLBACK_BROADCAST: 'APP_UPDATE_ROLLBACK',
} as const;

/** Every outcome the worker may report for a `BOOT_OK`/`BOOT_FAILED` acknowledgement. */
export const BOOT_ACK_OUTCOMES = ['committed', 'rolled-back', 'ignored', 'error'] as const;
/** One of {@link BOOT_ACK_OUTCOMES}. */
export type BootAckOutcome = (typeof BOOT_ACK_OUTCOMES)[number];

/**
 * The watchdog's own bounded wait for a direct worker acknowledgement to its
 * `BOOT_OK`/`BOOT_FAILED` message, before falling back to its
 * `GET_ACTIVATION_STATUS`-derived deadline and the worker's own rollback
 * broadcast.
 */
export const WATCHDOG_ACK_TIMEOUT_MS = 5_000;
