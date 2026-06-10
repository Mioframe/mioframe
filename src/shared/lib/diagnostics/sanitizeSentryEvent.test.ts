import { describe, expect, it } from 'vitest';
import type { ErrorEvent as SentryErrorEvent } from '@sentry/vue';
import {
  sanitizeExceptionValue,
  sanitizeExceptionValues,
  createBeforeSend,
} from './sanitizeSentryEvent';

// ---------------------------------------------------------------------------
// sanitizeExceptionValue
// ---------------------------------------------------------------------------

describe('sanitizeExceptionValue', () => {
  it('keeps a short safe user-facing message unchanged', () => {
    const result = sanitizeExceptionValue({
      value: 'Could not create example',
      type: 'DomainError',
    });
    expect(result.value).toBe('Could not create example');
  });

  it('keeps a short VFS error code unchanged', () => {
    const result = sanitizeExceptionValue({ value: 'EACCES', type: 'VfsError' });
    expect(result.value).toBe('EACCES');
  });

  it('replaces an absolute path message with [sanitized]', () => {
    const result = sanitizeExceptionValue({
      value: 'ENOENT: no such file or directory, mkdir /private/Examples',
      type: 'Error',
    });
    expect(result.value).toBe('[sanitized]');
  });

  it('replaces a Windows path message with [sanitized]', () => {
    const result = sanitizeExceptionValue({
      value: 'C:\\Users\\developer\\projects\\repo',
      type: 'Error',
    });
    expect(result.value).toBe('[sanitized]');
  });

  it('replaces a URL message with [sanitized]', () => {
    const result = sanitizeExceptionValue({
      value: 'https://token@api.internal.company.com/v1/resource',
      type: 'Error',
    });
    expect(result.value).toBe('[sanitized]');
  });

  it('replaces an email-like message with [sanitized]', () => {
    const result = sanitizeExceptionValue({
      value: 'user@example.com access denied',
      type: 'Error',
    });
    expect(result.value).toBe('[sanitized]');
  });

  it('replaces a storage-key-like message with [sanitized]', () => {
    const result = sanitizeExceptionValue({
      value: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ_repo123',
      type: 'Error',
    });
    expect(result.value).toBe('[sanitized]');
  });

  it('replaces a message exceeding max length with [sanitized]', () => {
    const longMessage = 'x'.repeat(201);
    const result = sanitizeExceptionValue({ value: longMessage, type: 'Error' });
    expect(result.value).toBe('[sanitized]');
  });

  it('preserves exception type and stacktrace when sanitizing the value', () => {
    const result = sanitizeExceptionValue({
      value: '/private/secret/path',
      type: 'TypeError',
      stacktrace: { frames: [{ filename: 'app.js' }] },
    });
    expect(result.value).toBe('[sanitized]');
    expect(result.type).toBe('TypeError');
    expect(result.stacktrace).toEqual({ frames: [{ filename: 'app.js' }] });
  });

  it('returns entry unchanged when value is undefined', () => {
    const entry = { type: 'Error' };
    const result = sanitizeExceptionValue(entry);
    expect(result).toBe(entry);
  });
});

// ---------------------------------------------------------------------------
// sanitizeExceptionValues
// ---------------------------------------------------------------------------

describe('sanitizeExceptionValues', () => {
  it('sanitizes all entries in the exception chain', () => {
    const exception: SentryErrorEvent['exception'] = {
      values: [
        { value: 'Could not create example', type: 'DomainError' },
        { value: 'ENOENT: no such file or directory /private/Examples', type: 'Error' },
      ],
    };

    const result = sanitizeExceptionValues(exception);

    expect(result?.values?.[0]?.value).toBe('Could not create example');
    expect(result?.values?.[1]?.value).toBe('[sanitized]');
  });

  it('sanitizes a single-entry exception', () => {
    const exception: SentryErrorEvent['exception'] = {
      values: [{ value: 'postgres://admin:pass@db.company.com/db', type: 'Error' }],
    };

    const result = sanitizeExceptionValues(exception);
    expect(result?.values?.[0]?.value).toBe('[sanitized]');
  });

  it('returns undefined when exception is undefined', () => {
    expect(sanitizeExceptionValues(undefined)).toBeUndefined();
  });

  it('returns the exception unchanged when there are no values', () => {
    const exception: SentryErrorEvent['exception'] = {};
    const result = sanitizeExceptionValues(exception);
    expect(result).toBe(exception);
  });

  it('preserves exception type while sanitizing the message', () => {
    const exception: SentryErrorEvent['exception'] = {
      values: [{ value: '/secret/path/to/file', type: 'WebFileSystemAccessRequiredError' }],
    };

    const result = sanitizeExceptionValues(exception);
    expect(result?.values?.[0]?.type).toBe('WebFileSystemAccessRequiredError');
    expect(result?.values?.[0]?.value).toBe('[sanitized]');
  });
});

// ---------------------------------------------------------------------------
// createBeforeSend — exception value sanitization in full pipeline
// ---------------------------------------------------------------------------

const makeEnabledBeforeSend = () =>
  createBeforeSend({ isVerbose: false, getState: () => 'enabled' });

describe('createBeforeSend exception value sanitization', () => {
  it('passes a safe DomainError message through the event pipeline unchanged', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [{ value: 'Could not create example', type: 'DomainError' }],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('Could not create example');
  });

  it('sanitizes a raw path in the top-level exception message', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [
          { value: 'ENOENT: no such file, open /Users/dev/project/secret.json', type: 'Error' },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('[sanitized]');
  });

  it('sanitizes a raw cause message in a nested linked exception', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [
          { value: 'Could not save changes', type: 'DomainError' },
          {
            value: 'Connection failed to postgres://admin:pass@db.internal:5432/mioframe',
            type: 'Error',
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('Could not save changes');
    expect(result?.exception?.values?.[1]?.value).toBe('[sanitized]');
  });

  it('sanitizes a raw absolute path in the cause exception chain', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [
          { value: 'Could not create example', type: 'DomainError' },
          {
            value: '/home/developer/projects/beaver/src/config/secrets.json: access denied',
            type: 'Error',
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('Could not create example');
    expect(result?.exception?.values?.[1]?.value).toBe('[sanitized]');
  });

  it('keeps stack frames intact while sanitizing the exception message', () => {
    const beforeSend = makeEnabledBeforeSend();
    const frames = [{ filename: 'useExampleDocumentsCreate.ts', lineno: 42 }];
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [{ value: '/secret/path', type: 'Error', stacktrace: { frames } }],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('[sanitized]');
    expect(result?.exception?.values?.[0]?.stacktrace?.frames).toEqual(frames);
  });

  it('preserves exception type when sanitizing the message', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [{ value: '/secret/path', type: 'VfsError' }],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.type).toBe('VfsError');
    expect(result?.exception?.values?.[0]?.value).toBe('[sanitized]');
  });

  it('keeps a stable error code in tags while sanitizing the message', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [{ value: '/secret/path', type: 'DomainError' }],
      },
      tags: { eventKind: 'handledException', feature: 'exampleDocumentsCreate' },
    };

    const result = beforeSend(event);

    expect(result?.tags?.['eventKind']).toBe('handledException');
    expect(result?.tags?.['feature']).toBe('exampleDocumentsCreate');
    expect(result?.exception?.values?.[0]?.value).toBe('[sanitized]');
  });

  it('drops a raw path from tags while keeping safe values', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: { values: [{ value: 'Could not save', type: 'DomainError' }] },
      tags: {
        eventKind: 'handledException',
        filePath: '/Users/dev/doc.json',
        feature: 'repositorySync',
      },
    };

    const result = beforeSend(event);

    expect(result?.tags?.['filePath']).toBeUndefined();
    expect(result?.tags?.['feature']).toBe('repositorySync');
  });

  it('strips user fields except a valid session-scoped id', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: { values: [] },
      user: { id: 'session:550e8400-e29b-41d4-a716-446655440000', email: 'user@example.com' },
    };

    const result = beforeSend(event);

    expect(result?.user?.id).toMatch(/^session:/);
    expect(result?.user).not.toHaveProperty('email');
  });

  it('sanitizes a token-like string in extras', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: { values: [] },
      extra: { operation: 'save', authToken: 'Bearer sk-1234567890abcdef' },
    };

    const result = beforeSend(event);

    expect(result?.extra?.['operation']).toBe('save');
    expect(result?.extra?.['authToken']).toBeUndefined();
  });

  it('drops events when reporting state is not enabled', () => {
    const beforeSend = createBeforeSend({ isVerbose: false, getState: () => 'disabled' });
    const event: SentryErrorEvent = {
      type: undefined,
      exception: { values: [{ value: 'Something failed', type: 'Error' }] },
    };

    expect(beforeSend(event)).toBeNull();
  });
});
