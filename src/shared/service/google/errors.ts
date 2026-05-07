import { DomainError } from '@shared/lib/error';

/**
 * Stable error codes for Google authorization flows.
 */
export enum GoogleAuthErrorCode {
  popupBlocked = 'popup_blocked',
  reauthRequired = 'reauth_required',
  accountMismatch = 'account_mismatch',
  revokeFailed = 'revoke_failed',
}

/**
 * Context used to build a Google authorization error.
 */
type GoogleAuthErrorDetails = {
  /** Stable authorization error code. */
  code: GoogleAuthErrorCode;
  /** Expected account email when relevant. */
  expectedEmail?: string | undefined;
  /** Actual authorized account email when relevant. */
  actualEmail?: string | undefined;
  /** Account email associated with the revoke flow. */
  email?: string | undefined;
};

/**
 * Optional constructor options for Google authorization errors.
 */
type GoogleAuthErrorOptions = {
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
};

/**
 * Domain error for user-facing Google authorization failures.
 */
export class GoogleAuthError extends DomainError<GoogleAuthErrorCode> {
  override name = 'GoogleAuthError';
  /** Stable authorization error code. */
  override readonly code: GoogleAuthErrorCode;
  /** Expected account email when relevant. */
  readonly expectedEmail?: string | undefined;
  /** Actual authorized account email when relevant. */
  readonly actualEmail?: string | undefined;
  /** Account email associated with the revoke flow. */
  readonly email?: string | undefined;

  /**
   * Creates a Google authorization error from typed flow context.
   * @param details - Structured details that determine the user-facing message.
   * @param options - Optional cause preserved for debugging.
   */
  constructor(
    { code, expectedEmail, actualEmail, email }: GoogleAuthErrorDetails,
    options?: GoogleAuthErrorOptions,
  ) {
    super(
      GoogleAuthError.getMessage({
        code,
        expectedEmail,
        actualEmail,
        email,
      }),
      options,
    );
    this.code = code;
    this.expectedEmail = expectedEmail;
    this.actualEmail = actualEmail;
    this.email = email;
  }

  /**
   * Builds the user-facing authorization message from typed error details.
   * @param details - Structured authorization failure details.
   * @returns User-facing message for the current authorization failure.
   */
  private static getMessage({ code, expectedEmail, actualEmail, email }: GoogleAuthErrorDetails) {
    switch (code) {
      case GoogleAuthErrorCode.popupBlocked:
        return 'Browser blocked the Google authorization popup';
      case GoogleAuthErrorCode.reauthRequired:
        return `Google Drive access requires authorization for ${expectedEmail ?? 'the required account'}`;
      case GoogleAuthErrorCode.accountMismatch:
        return `Authorized as ${actualEmail ?? 'another account'}, but ${expectedEmail ?? 'the required account'} is required`;
      case GoogleAuthErrorCode.revokeFailed:
        return `Failed to revoke Google Drive access for ${email ?? 'the current account'}`;
      default:
        return 'Unexpected Google authorization error';
    }
  }
}
