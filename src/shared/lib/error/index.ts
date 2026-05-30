import { isString } from 'es-toolkit';

/**
 * Serialized representation of a domain error for transport across boundaries.
 */
export type SerializedDomainError<TCode extends PropertyKey = string> = {
  /** Error class name. */
  name: string;
  /** User-facing error message. */
  message: string;
  /** Stable machine-readable error code. */
  code?: TCode | undefined;
  /** Original stack trace when available. */
  stack?: string | undefined;
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
};

/**
 * Options for constructing a domain error.
 */
export type DomainErrorOptions<TCode extends PropertyKey = string> = {
  /** Underlying cause preserved for debugging. */
  cause?: unknown;
  /** Stable machine-readable error code. */
  code?: TCode;
};

/**
 * Error type for user-facing domain failures with optional stable codes.
 */
export class DomainError<TCode extends PropertyKey = string> extends Error {
  override name = 'DomainError';
  __isDomainError = true;
  code?: TCode | undefined;

  /**
   * Creates a domain error from either a user-facing message or serialized data.
   * @param options - User-facing message or serialized error payload.
   * @param initialOptions - Optional cause and code when constructing from a message.
   */
  constructor(
    options: string | SerializedDomainError<TCode> = 'Unexpected error',
    { cause: initialCause, code: initialCode }: DomainErrorOptions<TCode> = {},
  ) {
    if (isString(options)) {
      super(options);
      this.cause = initialCause;
      this.code = initialCode;
    } else {
      const { message, name, stack, cause: serializedCause, code } = options;
      super(message);
      this.name = name;
      this.code = code;
      if (stack !== undefined) {
        this.stack = stack;
      }
      this.cause = serializedCause;
    }
  }

  /**
   * Serializes the error for worker transport and structured cloning.
   * @returns Serializable domain error payload.
   */
  toJSON(): SerializedDomainError<TCode> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      stack: this.stack,
      cause: this.cause,
    };
  }
}

export { HttpStatusCode } from './httpStatus';
export { createSafeErrorCause } from './createSafeErrorCause';

/**
 * Resolves a user-facing error message from an arbitrary error value.
 * Returns the `DomainError.message` when the error is a `DomainError`;
 * otherwise returns a safe project-controlled fallback so that raw
 * exception messages (which may contain paths, IDs, or external data)
 * never reach the UI.
 * @param error - The error thrown by a read operation.
 * @param fallbackMessage - Safe message to use when the error is not a `DomainError`.
 * @returns A user-safe message string, or `undefined` when no error occurred.
 */
export const resolveSafeErrorMessage = (
  error: unknown,
  fallbackMessage = 'Error reading directory',
): string | undefined => {
  if (error === undefined || error === null) {
    return undefined;
  }

  if (error instanceof DomainError) {
    return error.message;
  }

  return fallbackMessage;
};
