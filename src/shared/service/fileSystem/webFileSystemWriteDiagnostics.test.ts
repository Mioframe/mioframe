import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWebFileSystemDiagnosticStepBreadcrumb } from './webFileSystemWriteDiagnostics';

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    addTechnicalBreadcrumb: vi.fn(),
  };
});

describe('webFileSystemWriteDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(addTechnicalBreadcrumb).mockReset();
  });

  it('adds safe breadcrumbs for file handle create, file lookup, writable open, and file write steps', () => {
    const writableOpenError = new DOMException('The handle became invalid', 'InvalidStateError');
    Object.defineProperty(writableOpenError, 'code', {
      configurable: true,
      value: 11,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileHandleCreate', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileHandleCreate', result: 'succeeded' });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileHandleCreate',
      result: 'failed',
      error: new DOMException('msg', 'InvalidModificationError'),
    });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'writableOpen', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      error: writableOpenError,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileWrite',
      result: 'failed',
      error: new DOMException('msg', 'QuotaExceededError'),
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.write',
      data: {
        operation: 'createFileHandle',
        provider: 'webFileSystem',
        result: 'started',
        step: 'fileHandleCreate',
      },
      level: 'info',
      message: 'file handle create started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'createFileHandle',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'fileHandleCreate',
      },
      level: 'info',
      message: 'file handle create succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'createFileHandle',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileHandleCreate',
        errorClass: 'DOMException',
        domException: 'InvalidModificationError',
      },
      level: 'warning',
      message: 'file handle create failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'started',
        step: 'writableOpen',
      },
      level: 'info',
      message: 'writable open started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(5, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'writableOpen',
        classification: 'writeStreamOpenFailed',
        errorClass: 'DOMException',
        domException: 'InvalidStateError',
        domExceptionCode: 11,
        errorDetail: 'The handle became invalid',
      },
      level: 'warning',
      message: 'writable open failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
      category: 'webFileSystem.write',
      data: {
        operation: 'writeFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileWrite',
        errorClass: 'DOMException',
        domException: 'QuotaExceededError',
      },
      level: 'warning',
      message: 'file write failed',
    });
  });

  it('drops milestones that should not become breadcrumbs', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'parentDirectoryLookup', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'unknownStep', result: 'succeeded' });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });

  it('breadcrumb data contains only allowed fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      error: new DOMException('msg', 'InvalidStateError'),
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    const allowedKeys = new Set([
      'operation',
      'provider',
      'result',
      'step',
      'classification',
      'errorClass',
      'domException',
      'domExceptionCode',
      'errorDetail',
    ]);
    for (const key of Object.keys(data)) {
      expect(allowedKeys).toContain(key);
    }
  });

  it('fileLookup breadcrumbs are emitted for started, missing, and succeeded', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'missing' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'succeeded' });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(3);
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ message: 'file lookup started' }),
    );
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ message: 'file lookup missing' }),
    );
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ message: 'file lookup succeeded' }),
    );
  });

  it('all emitted breadcrumbs use the webFileSystem.write category', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileLookup', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileHandleCreate', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'writableOpen', result: 'started' });

    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].category).toBe('webFileSystem.write');
    }
  });

  it('does not include error metadata when no error is provided', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileHandleCreate', result: 'failed' });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    expect(data).not.toHaveProperty('errorClass');
    expect(data).not.toHaveProperty('domException');
    expect(data).not.toHaveProperty('domExceptionCode');
    expect(data).not.toHaveProperty('errorDetail');
  });

  it('drops sensitive writableOpen error details while keeping safe classification fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      error: new DOMException('Failed for /private/documents/secret.txt', 'InvalidStateError'),
    });

    expect(addTechnicalBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          classification: 'writeStreamOpenFailed',
          domException: 'InvalidStateError',
        }),
      }),
    );
    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    expect(call?.[0]?.data).not.toHaveProperty('errorDetail');
  });
});
