/// <reference types="google.accounts" />

import { DomainError } from '@shared/lib/error';
import { z } from 'zod/v4-mini';

export const zodGoogleClientConfigError = z.looseObject({
  message: z.string(),
  name: z.string(),
  type: z.enum(['popup_closed', 'popup_failed_to_open', 'unknown']),
});

type GoogleClientConfigErrorValue = z.infer<typeof zodGoogleClientConfigError>;

export class GoogleClientConfigError extends DomainError {
  override name = 'GoogleClientConfigError';
  readonly details: GoogleClientConfigErrorValue;
  readonly type: GoogleClientConfigErrorValue['type'];
  readonly googleErrorName: GoogleClientConfigErrorValue['name'];

  constructor(
    error: google.accounts.oauth2.ClientConfigError,
    options?: { cause?: unknown },
  ) {
    super(error.message, options);
    this.details = zodGoogleClientConfigError.parse({
      message: error.message,
      name: error.name,
      type: error.type,
    });
    this.type = this.details.type;
    this.googleErrorName = this.details.name;
  }
}
