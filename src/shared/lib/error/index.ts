import { isString } from 'es-toolkit';

export type SerializedDomainError = {
  name: string;
  message: string;
  stack?: string | undefined;
  cause?: unknown;
};

export class DomainError extends Error {
  override name = 'DomainError';
  __isDomainError = true;

  constructor(serialized: SerializedDomainError);
  constructor(message?: string, options?: { cause?: unknown });
  constructor(
    options: string | SerializedDomainError = 'Unexpected error',
    { cause: initialCause }: { cause?: unknown } = {},
  ) {
    if (isString(options)) {
      super(options);
      this.cause = initialCause;
    } else {
      const { message, name, stack, cause: serializedCause } = options;
      super(message);
      this.name = name;
      if (stack !== undefined) {
        this.stack = stack;
      }
      this.cause = serializedCause;
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

export { HttpStatusCode } from './httpStatus';
