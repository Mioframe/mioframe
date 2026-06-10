import { describe, expect, it } from 'vitest';
import type { ErrorEvent as SentryErrorEvent, Exception as SentryException } from '@sentry/vue';
import {
  sanitizeExceptionValue,
  sanitizeExceptionValues,
  sanitizeMechanism,
  sanitizeStacktrace,
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

  it('preserves type and omits value when value is undefined', () => {
    const result = sanitizeExceptionValue({ type: 'Error' });
    expect(result.type).toBe('Error');
    expect(result).not.toHaveProperty('value');
  });

  it('preserves safe well-known error type names unchanged', () => {
    expect(sanitizeExceptionValue({ type: 'VfsError' }).type).toBe('VfsError');
    expect(sanitizeExceptionValue({ type: 'DomainError' }).type).toBe('DomainError');
    expect(sanitizeExceptionValue({ type: 'WebFileSystemAccessRequiredError' }).type).toBe(
      'WebFileSystemAccessRequiredError',
    );
    expect(sanitizeExceptionValue({ type: 'TypeError' }).type).toBe('TypeError');
  });

  it('replaces an unsafe path-like exception type with Error', () => {
    const result = sanitizeExceptionValue({ type: '/home/user/inject/CustomError', value: 'oops' });
    expect(result.type).toBe('Error');
  });

  it('replaces an unsafe URL-like exception type with Error', () => {
    const result = sanitizeExceptionValue({ type: 'http://evil.com/Error', value: 'oops' });
    expect(result.type).toBe('Error');
  });

  it('keeps a safe short exception module', () => {
    const result = sanitizeExceptionValue({ type: 'Error', module: 'diagnostics' });
    expect(result.module).toBe('diagnostics');
  });

  it('drops an unsafe URL-like exception module', () => {
    const result = sanitizeExceptionValue({
      type: 'Error',
      module: 'app://localhost/src/shared/lib/diagnostics',
    });
    expect(result).not.toHaveProperty('module');
  });

  it('drops an unsafe path-like exception module', () => {
    const result = sanitizeExceptionValue({ type: 'Error', module: '/home/user/projects/app' });
    expect(result).not.toHaveProperty('module');
  });

  it('preserves stack frames when sanitizing unsafe type and module', () => {
    const result = sanitizeExceptionValue({
      type: '/injected/path/Error',
      module: 'app://localhost/bundle.js',
      stacktrace: { frames: [{ filename: 'app.ts', lineno: 1 }] },
    });
    expect(result.type).toBe('Error');
    expect(result).not.toHaveProperty('module');
    expect(result.stacktrace?.frames?.[0]?.filename).toBe('app.ts');
  });
});

// ---------------------------------------------------------------------------
// sanitizeMechanism
// ---------------------------------------------------------------------------

describe('sanitizeMechanism', () => {
  it('keeps type and handled while dropping data', () => {
    const result = sanitizeMechanism({
      type: 'generic',
      handled: true,
      data: { handler: 'onClick', target: '/home/user/Projects/app/src/handler.ts' },
    });
    expect(result.type).toBe('generic');
    expect(result.handled).toBe(true);
    expect(result).not.toHaveProperty('data');
  });

  it('removes mechanism.data with raw token-like values', () => {
    const result = sanitizeMechanism({
      type: 'instrument',
      data: { authToken: 'Bearer sk-1234567890abcdef1234567890' },
    });
    expect(result).not.toHaveProperty('data');
  });

  it('removes mechanism.meta', () => {
    const result = sanitizeMechanism({
      type: 'onerror',
      // @ts-expect-error testing runtime sanitization of unknown meta field
      meta: { signal: 'unhandledrejection', extra: 'raw-payload' },
    });
    expect(result).not.toHaveProperty('meta');
  });

  it('preserves source, synthetic, exception_id, parent_id, is_exception_group', () => {
    const result = sanitizeMechanism({
      type: 'chained',
      synthetic: false,
      source: 'cause',
      exception_id: 1,
      parent_id: 0,
      is_exception_group: false,
    });
    expect(result.source).toBe('cause');
    expect(result.synthetic).toBe(false);
    expect(result.exception_id).toBe(1);
    expect(result.parent_id).toBe(0);
    expect(result.is_exception_group).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// sanitizeStacktrace
// ---------------------------------------------------------------------------

describe('sanitizeStacktrace', () => {
  it('removes vars from all frames', () => {
    const result = sanitizeStacktrace({
      frames: [
        {
          filename: 'useExampleDocumentsCreate.ts',
          lineno: 42,
          vars: {
            path: '/home/developer/projects/beaver/src/config/secrets.json',
            authToken: 'sk-secret-token',
          },
        },
        { filename: 'main.ts', lineno: 1 },
      ],
    });
    expect(result.frames?.[0]).not.toHaveProperty('vars');
    expect(result.frames?.[1]).not.toHaveProperty('vars');
  });

  it('preserves filename, function, lineno, colno, in_app', () => {
    const result = sanitizeStacktrace({
      frames: [
        { filename: 'app.ts', function: 'createExample', lineno: 10, colno: 5, in_app: true },
      ],
    });
    expect(result.frames?.[0]).toEqual(
      expect.objectContaining({ filename: 'app.ts', function: 'createExample', lineno: 10 }),
    );
  });

  it('returns stacktrace unchanged when no frames', () => {
    const st = {};
    expect(sanitizeStacktrace(st)).toBe(st);
  });
});

// ---------------------------------------------------------------------------
// sanitizeExceptionValue — full entry sanitization
// ---------------------------------------------------------------------------

describe('sanitizeExceptionValue — full entry sanitization', () => {
  it('drops custom enumerable fields not in the standard exception interface', () => {
    const entry: SentryException = { value: 'Something failed', type: 'DomainError' };
    Object.assign(entry, {
      rawFilePath: '/home/user/projects/secret.json',
      providerPayload: 'Bearer abc123',
    });
    const result = sanitizeExceptionValue(entry);
    expect(result).not.toHaveProperty('rawFilePath');
    expect(result).not.toHaveProperty('providerPayload');
    expect(result.type).toBe('DomainError');
    expect(result.value).toBe('Something failed');
  });

  it('sanitizes mechanism.data containing raw path values while keeping mechanism type and handled', () => {
    const result = sanitizeExceptionValue({
      value: 'Could not create example',
      type: 'DomainError',
      mechanism: {
        type: 'generic',
        handled: true,
        data: { errorPath: '/home/developer/projects/beaver/private/doc.json' },
      },
    });
    expect(result.value).toBe('Could not create example');
    expect(result.mechanism?.type).toBe('generic');
    expect(result.mechanism?.handled).toBe(true);
    expect(result.mechanism).not.toHaveProperty('data');
  });

  it('removes vars from stacktrace frames while keeping frame metadata', () => {
    const result = sanitizeExceptionValue({
      value: 'Path not found.',
      type: 'VfsError',
      stacktrace: {
        frames: [
          {
            filename: 'MemoryFileSystem.ts',
            lineno: 70,
            vars: { path: '/Users/developer/Documents/repos/beaver/secret.json' },
          },
        ],
      },
    });
    expect(result.stacktrace?.frames?.[0]).not.toHaveProperty('vars');
    expect(result.stacktrace?.frames?.[0]?.filename).toBe('MemoryFileSystem.ts');
    expect(result.stacktrace?.frames?.[0]?.lineno).toBe(70);
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

  it('removes mechanism.data with a raw document path from the exception entry', () => {
    const beforeSend = makeEnabledBeforeSend();
    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {
            value: 'Could not create example',
            type: 'DomainError',
            mechanism: {
              type: 'generic',
              handled: true,
              data: {
                documentPath:
                  '/home/matdr/Documents/repos/beaver/src/private/doc_ABCDEFGHIJ_12345.json',
              },
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    expect(result?.exception?.values?.[0]?.value).toBe('Could not create example');
    expect(result?.exception?.values?.[0]?.mechanism?.type).toBe('generic');
    expect(result?.exception?.values?.[0]?.mechanism?.handled).toBe(true);
    expect(result?.exception?.values?.[0]?.mechanism).not.toHaveProperty('data');
  });

  it('removes frame vars containing absolute paths, repo IDs, and auth tokens', () => {
    const beforeSend = makeEnabledBeforeSend();
    const DANGEROUS_VALUES = {
      localPath: '/home/matdr/Projects/beaver/src/config/secrets.json',
      repoId: 'repo_ABCDE12345_xyz789',
      authHeader: 'Authorization: Bearer ghp_secret1234567890abcdef',
      docName: 'My confidential budget 2025',
      urlWithQuery: 'https://api.example.com/v1/resource?token=abc&user=matdr',
    };

    const event: SentryErrorEvent = {
      type: undefined,
      exception: {
        values: [
          {
            value: 'Directory not found.',
            type: 'VfsError',
            stacktrace: {
              frames: [
                {
                  filename: 'VirtualFileSystem.ts',
                  function: 'resolve',
                  lineno: 42,
                  vars: DANGEROUS_VALUES,
                },
              ],
            },
          },
        ],
      },
    };

    const result = beforeSend(event);

    const frame = result?.exception?.values?.[0]?.stacktrace?.frames?.[0];
    expect(frame).not.toHaveProperty('vars');
    expect(frame?.filename).toBe('VirtualFileSystem.ts');
    expect(frame?.function).toBe('resolve');
    expect(frame?.lineno).toBe(42);
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
