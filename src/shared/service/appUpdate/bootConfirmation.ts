/**
 * Boot-confirmation deadline for a clean-launch activation: the maximum time
 * a target release has to report `BOOT_OK` before the worker treats it as
 * failed and rolls back. Covers only the minimal application shell bootstrap
 * (root created, initial navigation resolved, root mounted, required
 * background-bridge init) — not document loading, provider connection, or
 * other optional integrations. Shared by the controller worker (activation
 * deadline) and the publisher-injected watchdog (its own timeout), so both
 * sides agree on one value.
 */
export const BOOT_CONFIRMATION_TIMEOUT_MS = 30_000;

/**
 * How long the publisher-injected boot watchdog waits for the controller
 * worker's durable `BOOT_OK`/`BOOT_FAILED` acknowledgement before treating
 * the acknowledgement itself as failed (distinct from
 * {@link BOOT_CONFIRMATION_TIMEOUT_MS}, which bounds the whole application
 * boot). Kept in parity with the literal copy in
 * `scripts/pages/lib/watchdogInject.mjs` — see
 * `watchdogProtocolParity.test.ts`.
 */
export const BOOT_ACK_TIMEOUT_MS = 5_000;
