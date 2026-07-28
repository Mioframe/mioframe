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
