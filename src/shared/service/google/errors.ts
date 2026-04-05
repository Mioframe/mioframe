import { DomainError } from '@shared/lib/error';

export enum GoogleAuthErrorCode {
  popupBlocked = 'popup_blocked',
  reauthRequired = 'reauth_required',
  accountMismatch = 'account_mismatch',
  revokeFailed = 'revoke_failed',
}

export class GoogleAuthError extends DomainError {
  override name = 'GoogleAuthError';
  readonly code: GoogleAuthErrorCode;
  readonly expectedEmail?: string;
  readonly actualEmail?: string;
  readonly email?: string;

  constructor(
    {
      code,
      expectedEmail,
      actualEmail,
      email,
    }: {
      code: GoogleAuthErrorCode;
      expectedEmail?: string;
      actualEmail?: string;
      email?: string;
    },
    options?: { cause?: unknown },
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

  private static getMessage({
    code,
    expectedEmail,
    actualEmail,
    email,
  }: {
    code: GoogleAuthErrorCode;
    expectedEmail?: string;
    actualEmail?: string;
    email?: string;
  }) {
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
