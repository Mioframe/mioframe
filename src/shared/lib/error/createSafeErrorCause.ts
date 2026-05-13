/**
 * Creates a privacy-safe technical cause error for diagnostics reporting.
 * Use this instead of propagating raw browser, filesystem, API, or library errors
 * when the cause may be reported through handled diagnostics.
 * @param message - Stable project-controlled technical cause message.
 * @returns Error with a safe message for diagnostics.
 */
export const createSafeErrorCause = (message: string): Error => new Error(message);
