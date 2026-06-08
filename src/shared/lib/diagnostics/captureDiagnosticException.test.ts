import { beforeEach, describe, expect, it, vi } from 'vitest';

const captureExceptionMock = vi.fn();

vi.mock('./sentryRuntime', () => ({
  useSentry: () => ({
    captureException: captureExceptionMock,
  }),
}));

describe('captureDiagnosticException', () => {
  beforeEach(() => {
    captureExceptionMock.mockReset();
  });

  it('reports handled diagnostic exceptions via capture context', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(
      error,
      {
        operation: 'repositorySave',
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
        errorClassification: 'storageFailure',
        failureClassification: 'accessRequired',
        runtime: 'worker',
      },
      {
        provider: 'indexedDb',
      },
    );

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: {
        handled: 'true',
        provider: 'indexedDb',
      },
      contexts: {
        diagnostic: {
          operation: 'repositorySave',
          errorClass: 'DOMException',
          domExceptionName: 'QuotaExceededError',
          errorClassification: 'storageFailure',
          failureClassification: 'accessRequired',
          runtime: 'worker',
        },
      },
    });
  });

  it('omits the diagnostic context when no fields are provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {});

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: {
        handled: 'true',
      },
    });
  });
});
