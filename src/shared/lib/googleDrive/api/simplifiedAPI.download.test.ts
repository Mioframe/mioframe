import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { createJsonResponse } from './simplifiedAPI.testUtils';

describe('simplifiedAPI download failure diagnostics', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('classifies a metadata fetch failure (HTTP 403) with phase=metadata', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.FORBIDDEN,
            message: 'File gd-123 "Tax 2025" was not found in folder Private',
            errors: [{ domain: 'global', reason: 'insufficientFilePermissions' }],
          },
        }),
        { status: HttpStatusCode.FORBIDDEN },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      message: 'Google Drive download failed',
      code: HttpStatusCode.FORBIDDEN,
      safeDetails: {
        providerOperation: 'googleDrive.download',
        providerPhase: 'metadata',
        providerStatus: HttpStatusCode.FORBIDDEN,
        providerReason: 'insufficientFilePermissions',
        providerDomain: 'global',
        providerRetryable: 'false',
        providerErrorCode: 'permissionDenied',
      },
      cause: expect.objectContaining({
        message:
          'Google Drive download failed (operation=googleDrive.download phase=metadata status=403 reason=insufficientFilePermissions domain=global retryable=false code=permissionDenied)',
      }),
    });
  });

  it('classifies a media download failure (HTTP 404) with phase=mediaDownload', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: HttpStatusCode.NOT_FOUND,
              message: 'File gd-123 "Tax 2025" was not found in folder Private',
              errors: [{ domain: 'global', reason: 'notFound' }],
            },
          }),
          { status: HttpStatusCode.NOT_FOUND },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      name: 'GoogleDriveError',
      message: 'Google Drive download failed',
      code: HttpStatusCode.NOT_FOUND,
      safeDetails: {
        providerOperation: 'googleDrive.download',
        providerPhase: 'mediaDownload',
        providerStatus: HttpStatusCode.NOT_FOUND,
        providerReason: 'notFound',
        providerDomain: 'global',
        providerRetryable: 'false',
        providerErrorCode: 'notFound',
      },
      cause: expect.objectContaining({
        message:
          'Google Drive download failed (operation=googleDrive.download phase=mediaDownload status=404 reason=notFound domain=global retryable=false code=notFound)',
      }),
    });
  });

  it('classifies a media download failure (HTTP 429) as retryable', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: HttpStatusCode.TOO_MANY_REQUESTS, message: 'Rate limited' },
          }),
          { status: HttpStatusCode.TOO_MANY_REQUESTS },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      cause: expect.objectContaining({
        message: expect.stringContaining(
          'phase=mediaDownload status=429 retryable=true code=rateLimited',
        ),
      }),
    });
  });

  it('classifies a media download failure (HTTP 500) as retryable server error', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error: { code: HttpStatusCode.INTERNAL_SERVER_ERROR, message: 'Server error' },
          }),
          { status: HttpStatusCode.INTERNAL_SERVER_ERROR },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      cause: expect.objectContaining({
        message: expect.stringContaining(
          'phase=mediaDownload status=500 retryable=true code=serverError',
        ),
      }),
    });
  });

  it('classifies an unknown/network media download failure as unknown', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      cause: expect.objectContaining({
        message:
          'Google Drive download failed (operation=googleDrive.download phase=mediaDownload retryable=unknown code=unknown)',
      }),
    });
  });

  it('never includes the file id, name, path, or raw Google API message in safe diagnostics', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          error: {
            code: HttpStatusCode.NOT_FOUND,
            message:
              'File gd-secret-id "Private Taxes.pdf" not found at /user@example.com/My Drive',
            errors: [{ domain: 'global', reason: 'notFound' }],
          },
        }),
        { status: HttpStatusCode.NOT_FOUND },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error: unknown = await download({ ACCESS_TOKEN: 'token' }, 'gd-secret-id').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toBeInstanceOf(Error);
    const cause = error instanceof Error ? error.cause : undefined;
    const safeMessage = cause instanceof Error ? cause.message : '';
    expect(safeMessage).not.toContain('gd-secret-id');
    expect(safeMessage).not.toContain('Private Taxes.pdf');
    expect(safeMessage).not.toContain('/user@example.com');
    expect(safeMessage).not.toContain('not found at');

    const safeDetailsJson = JSON.stringify(
      error && typeof error === 'object' && 'safeDetails' in error ? error.safeDetails : undefined,
    );
    expect(safeDetailsJson).not.toContain('gd-secret-id');
    expect(safeDetailsJson).not.toContain('Private Taxes.pdf');
    expect(safeDetailsJson).not.toContain('/user@example.com');
    expect(error).toMatchObject({
      safeDetails: expect.objectContaining({ providerStatus: HttpStatusCode.NOT_FOUND }),
    });
  });

  it('preserves the HTTP status in safe details even when the error body is non-JSON', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 'gd-123',
          name: 'notes.txt',
          mimeType: 'text/plain',
          modifiedTime: '2024-01-01T00:00:00.000Z',
        }),
      )
      .mockResolvedValue(
        new Response('<html>not json</html>', { status: HttpStatusCode.SERVICE_UNAVAILABLE }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { download } = await import('./simplifiedAPI');

    const error: unknown = await download({ ACCESS_TOKEN: 'token' }, 'gd-123').catch(
      (caughtError: unknown) => caughtError,
    );

    expect(error).toMatchObject({
      safeDetails: expect.objectContaining({
        providerPhase: 'mediaDownload',
        providerStatus: HttpStatusCode.SERVICE_UNAVAILABLE,
      }),
    });
  });
});
