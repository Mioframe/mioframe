import { isString } from 'es-toolkit';

export type SerializedDomainError = {
  name: string;
  message: string;
  stack?: string;
  cause?: unknown;
};

export class DomainError extends Error {
  override name = 'DomainError';
  __isDomainError = true;

  constructor(serialized: SerializedDomainError);
  constructor(message?: string, options?: { cause?: unknown });
  constructor(
    options: string | SerializedDomainError = 'Unexpected error',
    { cause }: { cause?: unknown } = {},
  ) {
    if (isString(options)) {
      super(options);
      this.cause = cause;
    } else {
      const { message, name, stack, cause } = options;
      super(message);
      this.name = name;
      this.stack = stack;
      this.cause = cause;
    }
  }

  toJSON(): SerializedDomainError {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
      cause: this.cause,
    };
  }
}
