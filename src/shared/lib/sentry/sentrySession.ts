const SESSION_USER_ID_PREFIX = 'session:';
let sessionId: string | undefined;

/**
 * Returns the session-scoped Sentry user ID, creating it on first call.
 * Stored in memory only — resets on page reload. Never persisted to storage.
 * The format is `session:<uuid>` so `beforeSend` can verify the origin.
 * @returns The session user ID string.
 */
export const getOrCreateSentrySessionId = (): string => {
  sessionId ??= `${SESSION_USER_ID_PREFIX}${crypto.randomUUID()}`;
  return sessionId;
};

/**
 * Returns whether a Sentry user ID is a valid in-memory session-scoped ID.
 * Non-session IDs (installation IDs, account IDs, email, etc.) must be rejected
 * by `beforeSend` to prevent long-term user tracking.
 * @param userId - The value to validate.
 * @returns `true` when the value is a session-prefixed string.
 */
export const isSessionSentryUserId = (userId: unknown): userId is string =>
  typeof userId === 'string' && userId.startsWith(SESSION_USER_ID_PREFIX);
