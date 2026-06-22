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

  it('reports a real Error with eventKind tag and no contexts when no context provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error);

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
    });
  });

  it('attaches diagnostic context when operation and failureClassification are provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {
      operation: 'repositorySave',
      failureClassification: 'accessRequired',
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
      contexts: {
        diagnostic: {
          operation: 'repositorySave',
          failureClassification: 'accessRequired',
        },
      },
    });
  });

  it('includes feature and action in tags when provided', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, { feature: 'importDocument', action: 'import' });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException', feature: 'importDocument', action: 'import' },
    });
  });

  it('merges scopeTags with standard tags', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, undefined, { provider: 'indexedDb' });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException', provider: 'indexedDb' },
    });
  });

  it('wraps a non-Error value in a synthetic Error', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');

    captureDiagnosticException('raw string error');

    expect(captureExceptionMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: expect.objectContaining({ eventKind: 'handledException' }) }),
    );
  });

  it('omits contexts when context object is empty', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {});

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
    });
  });

  it('merges safeDetails as visible top-level diagnostic context fields', async () => {
    const { captureDiagnosticException } = await import('./captureDiagnosticException');
    const error = new Error('boom');

    captureDiagnosticException(error, {
      operation: 'repositoryFactsDiscovery',
      safeDetails: {
        providerOperation: 'googleDrive.download',
        providerPhase: 'mediaDownload',
        providerStatus: 403,
        providerReason: null,
        providerDomain: null,
        providerRetryable: 'false',
        providerErrorCode: 'permissionDenied',
      },
    });

    expect(captureExceptionMock).toHaveBeenCalledWith(error, {
      tags: { eventKind: 'handledException' },
      contexts: {
        diagnostic: {
          operation: 'repositoryFactsDiscovery',
          providerOperation: 'googleDrive.download',
          providerPhase: 'mediaDownload',
          providerStatus: 403,
          providerReason: null,
          providerDomain: null,
          providerRetryable: 'false',
          providerErrorCode: 'permissionDenied',
        },
      },
    });
  });
});
