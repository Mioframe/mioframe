import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWebFileSystemReadDiagnosticStepBreadcrumb } from './webFileSystemReadDiagnostics';

vi.mock('@shared/lib/diagnostics', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/lib/diagnostics')>();
  return {
    ...actual,
    addTechnicalBreadcrumb: vi.fn(),
  };
});

describe('webFileSystemReadDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(addTechnicalBreadcrumb).mockReset();
  });

  it('adds a warning breadcrumb for a failed root read', () => {
    addWebFileSystemReadDiagnosticStepBreadcrumb({
      step: 'rootRead',
      result: 'failed',
      error: new DOMException('I/O error', 'NotReadableError'),
    });

    expect(addTechnicalBreadcrumb).toHaveBeenCalledWith({
      category: 'webFileSystem.read',
      data: {
        provider: 'webFileSystem',
        result: 'failed',
        step: 'rootRead',
        errorClass: 'DOMException',
      },
      level: 'warning',
      message: 'root directory read failed',
    });
  });

  it('adds info breadcrumbs for the permission recheck outcome', () => {
    addWebFileSystemReadDiagnosticStepBreadcrumb({
      step: 'rootReadPermissionRecheck',
      result: 'succeeded',
    });
    addWebFileSystemReadDiagnosticStepBreadcrumb({
      step: 'rootReadPermissionRecheck',
      result: 'failed',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.read',
      data: {
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'rootReadPermissionRecheck',
      },
      level: 'info',
      message: 'root read permission recheck still granted',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.read',
      data: {
        provider: 'webFileSystem',
        result: 'failed',
        step: 'rootReadPermissionRecheck',
      },
      level: 'info',
      message: 'root read permission recheck no longer granted',
    });
  });

  it('drops milestones that should not become breadcrumbs', () => {
    addWebFileSystemReadDiagnosticStepBreadcrumb({ step: 'fileHandleCreate', result: 'started' });
    addWebFileSystemReadDiagnosticStepBreadcrumb({ step: 'unknownStep', result: 'succeeded' });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });

  it('breadcrumb data contains only allowed fields and no raw error message', () => {
    addWebFileSystemReadDiagnosticStepBreadcrumb({
      step: 'rootRead',
      result: 'failed',
      error: new DOMException('Failed for /private/documents/secret', 'NotReadableError'),
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    const allowedKeys = new Set(['provider', 'result', 'step', 'errorClass']);
    for (const key of Object.keys(data)) {
      expect(allowedKeys).toContain(key);
    }
    expect(JSON.stringify(data)).not.toContain('/private/documents/secret');
  });

  it('does not include error metadata when no error is provided', () => {
    addWebFileSystemReadDiagnosticStepBreadcrumb({
      step: 'rootReadPermissionRecheck',
      result: 'succeeded',
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    expect(data).not.toHaveProperty('errorClass');
  });
});
