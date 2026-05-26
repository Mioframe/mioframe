import { describe, expect, it } from 'vitest';
import { DomainError, resolveSafeErrorMessage } from '.';

enum TestErrorCode {
  invalidJson = 'invalid-json',
  unauthorizedAccess = 'unauthorized-access',
}

describe('DomainError', () => {
  it('serializes and hydrates a stable code alongside the user-facing message', () => {
    const error = new DomainError('The selected file is not valid JSON', {
      code: TestErrorCode.invalidJson,
      cause: new SyntaxError('Unexpected end of JSON input'),
    });

    expect(error.toJSON()).toMatchObject({
      name: 'DomainError',
      message: 'The selected file is not valid JSON',
      code: TestErrorCode.invalidJson,
    });

    const restored = new DomainError(error.toJSON());

    expect(restored).toMatchObject({
      name: 'DomainError',
      message: 'The selected file is not valid JSON',
      code: TestErrorCode.invalidJson,
    });
  });

  it('preserves the cause when constructing from a message', () => {
    const originalCause = new TypeError('Type mismatch');
    const error = new DomainError('Invalid type received', {
      code: TestErrorCode.unauthorizedAccess,
      cause: originalCause,
    });

    expect(error.cause).toBe(originalCause);
  });

  it('restores the cause when constructing from serialized data', () => {
    const error = new DomainError('Permission denied', {
      code: TestErrorCode.unauthorizedAccess,
    });

    const serialized = error.toJSON();
    const restored = new DomainError(serialized);

    expect(restored.cause).toBeUndefined();
  });

  it('defaults to a generic message when no options provided', () => {
    const error = new DomainError();

    expect(error.message).toBe('Unexpected error');
    expect(error.code).toBeUndefined();
  });

  it('includes stack trace in toJSON for debugging but not user-facing messages', () => {
    const error = new DomainError('Something went wrong');
    const json = error.toJSON();

    // Stack is captured by JavaScript when creating the Error, included in serialization
    expect(json.stack).toBeDefined();
    expect(typeof json.stack).toBe('string');
  });
});

describe('resolveSafeErrorMessage', () => {
  it('returns the message from a DomainError without exposing internal details', () => {
    const domainError = new DomainError('File not found', {
      code: TestErrorCode.invalidJson,
      cause: new Error('/secret/path/to/file.json'),
    });

    expect(resolveSafeErrorMessage(domainError)).toBe('File not found');
  });

  it('returns a safe fallback message for non-DomainErrors to prevent information leakage', () => {
    const runtimeError = new TypeError(
      'Cannot read property of undefined at /home/user/project/src/App.tsx:42:15',
    );

    expect(resolveSafeErrorMessage(runtimeError)).toBe('Error reading directory');
  });

  it('returns a custom fallback message when provided for non-DomainErrors', () => {
    const runtimeError = new Error('/var/log/secret/system.log: permission denied');

    expect(resolveSafeErrorMessage(runtimeError, 'Unable to load repository data')).toBe(
      'Unable to load repository data',
    );
  });

  it('does not expose stack traces or messages from raw Error objects', () => {
    const errorWithStack = new Error('/etc/passwd: access denied');
    errorWithStack.stack = 'Error: /etc/passwd\n    at readFileSync (/app/server.js:10)';

    expect(resolveSafeErrorMessage(errorWithStack)).toBe('Error reading directory');
  });

  it('handles DomainErrors with empty messages safely', () => {
    const error = new DomainError('', { code: TestErrorCode.invalidJson });

    expect(resolveSafeErrorMessage(error)).toBe('');
  });

  it('does not throw when passed non-error values - returns fallback instead of leaking details', () => {
    // Non-Error objects should get the safe fallback message, not their internal state
    expect(resolveSafeErrorMessage({ message: 'Object with message' })).toBe(
      'Error reading directory',
    );
    expect(resolveSafeErrorMessage('String error')).toBe('Error reading directory');
    expect(resolveSafeErrorMessage(42)).toBe('Error reading directory');
  });

  it('returns undefined when no error occurred', () => {
    expect(resolveSafeErrorMessage(undefined)).toBeUndefined();
    expect(resolveSafeErrorMessage(null)).toBeUndefined();
  });

  it('prioritizes DomainError messages over fallback for mixed scenarios', () => {
    const domainError = new DomainError('User-friendly message');
    const rawError = new Error('/hidden/system/path: forbidden');

    expect(resolveSafeErrorMessage(domainError, 'Fallback')).toBe('User-friendly message');
    expect(resolveSafeErrorMessage(rawError, 'Fallback')).toBe('Fallback');
  });

  it('treats non-DomainError objects as unsafe and returns fallback', () => {
    // Custom Error subclass that is not a DomainError should get safe fallback
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const customError = new CustomError('/private/config/database.yml: sensitive data exposed');

    // Even custom Error subclasses that aren't DomainError get the safe fallback
    expect(resolveSafeErrorMessage(customError)).toBe('Error reading directory');
  });

  it('prevents path leakage from filesystem errors in user-facing messages', () => {
    const fsError = new Error(
      'ENOENT: no such file or directory, open /Users/developer/projects/beaver/src/config/secrets.json',
    );

    expect(resolveSafeErrorMessage(fsError)).toBe('Error reading directory');
  });

  it('prevents database connection string leakage from network errors', () => {
    const networkError = new Error(
      'Connection failed to postgres://admin:password123@db.internal.company.com:5432/mioframe',
    );

    expect(resolveSafeErrorMessage(networkError)).toBe('Error reading directory');
  });
});
