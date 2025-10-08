import { isString } from 'es-toolkit';

export type SerializedDomainError = {
  name: string;
  message: string;
  stack?: string;
};

export class DomainError extends Error {
  name = 'DomainError';
  __isDomainError = true;

  constructor(serialized: SerializedDomainError);
  constructor(message?: string);
  constructor(options: string | SerializedDomainError = 'Unexpected error') {
    if (isString(options)) {
      super(options);
    } else {
      const { message, name, stack } = options;
      super(message);
      this.name = name;
      this.stack = stack;
    }
  }

  toJSON(): SerializedDomainError {
    return {
      name: this.name,
      message: this.message,
      stack: this.stack,
    };
  }
}
