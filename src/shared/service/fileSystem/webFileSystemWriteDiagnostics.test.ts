import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addWebFileSystemDiagnosticStepBreadcrumb } from './webFileSystemWriteDiagnostics';

vi.mock('@shared/lib/diagnostics', () => ({
  addTechnicalBreadcrumb: vi.fn(),
}));

describe('webFileSystemWriteDiagnostics', () => {
  beforeEach(() => {
    vi.mocked(addTechnicalBreadcrumb).mockReset();
  });

  it('adds safe breadcrumbs for create re-lookup, cleanup, writable open, file write, and fresh retry milestones', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writeStrategySelected',
      result: 'directCreateWriteProbe',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWriteWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWrite',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileHandleLookupAfterCreate',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'createdFileCleanup',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidModificationError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableOpen',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'writableCompatibilityOpen',
      result: 'succeeded',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileWrite',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'QuotaExceededError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'freshHandleRetry',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.write',
      data: {
        operation: 'writeStrategySelected',
        provider: 'webFileSystem',
        result: 'directCreateWriteProbe',
        step: 'writeStrategySelected',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'write strategy selected',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWriteWritableOpen',
        provider: 'webFileSystem',
        result: 'started',
        step: 'directCreateWriteWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'direct create write writable open started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'directCreateWrite',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'directCreateWrite',
        writeStrategy: 'directCreateWriteProbe',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'direct create write failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'lookupHandleAfterCreate',
        provider: 'webFileSystem',
        result: 'started',
        step: 'fileHandleLookupAfterCreate',
      },
      level: 'info',
      message: 'file handle lookup after create started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(5, {
      category: 'webFileSystem.write',
      data: {
        operation: 'cleanupCreatedFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'createdFileCleanup',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidModificationError',
      },
      level: 'warning',
      message: 'created file cleanup failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
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
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(7, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritable',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'writableOpen',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'writable open failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(8, {
      category: 'webFileSystem.write',
      data: {
        operation: 'openWritableCompatibility',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'writableCompatibilityOpen',
      },
      level: 'info',
      message: 'writable compatibility open succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(9, {
      category: 'webFileSystem.write',
      data: {
        operation: 'writeFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileWrite',
        errorClass: 'DOMException',
        domExceptionName: 'QuotaExceededError',
      },
      level: 'warning',
      message: 'file write failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(10, {
      category: 'webFileSystem.write',
      data: {
        operation: 'freshHandleRetry',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'freshHandleRetry',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'fresh handle retry failed',
    });
  });

  it('drops milestones that should not become breadcrumbs', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'parentDirectoryLookup',
      result: 'started',
    });

    expect(addTechnicalBreadcrumb).not.toHaveBeenCalled();
  });

  it('adds safe breadcrumbs for read, stat, and directory boundary operations only', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileRead',
      result: 'started',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileRead',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileStat',
      result: 'succeeded',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directoryRead',
      result: 'failed',
      errorClass: 'DOMException',
      domExceptionName: 'NotAllowedError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.read',
      data: {
        operation: 'readFile',
        provider: 'webFileSystem',
        result: 'started',
        step: 'fileRead',
      },
      level: 'info',
      message: 'file read started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.read',
      data: {
        operation: 'readFile',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'fileRead',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'file read failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.stat',
      data: {
        operation: 'statFileHandle',
        provider: 'webFileSystem',
        result: 'succeeded',
        step: 'fileStat',
      },
      level: 'info',
      message: 'file stat succeeded',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.directory',
      data: {
        operation: 'readDirectory',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'directoryRead',
        errorClass: 'DOMException',
        domExceptionName: 'NotAllowedError',
      },
      level: 'warning',
      message: 'directory read failed',
    });
  });

  it('adds safe breadcrumbs for filename-matrix probe case success path', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWritableOpen',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWrite',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeClose',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCleanup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCleanup',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });

    const expectCrumb = (
      n: number,
      step: string,
      result: string,
      message: string,
      extra: Record<string, unknown> = {},
    ) => {
      expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(n, {
        category: 'webFileSystem.write',
        data: {
          operation: step,
          provider: 'webFileSystem',
          result,
          step,
          writeStrategy: 'directCreateWriteProbe',
          probeCase: 'shortTmpBaseline',
          probeFileName: 'mioframe-write-probe.tmp',
          probeFileNameLength: 23,
          ...extra,
        },
        level: result === 'failed' ? 'warning' : 'info',
        message,
      });
    };

    expectCrumb(1, 'filenameMatrixProbeCase', 'started', 'filenameMatrixProbeCase started');
    expectCrumb(
      2,
      'filenameMatrixProbeWritableOpen',
      'started',
      'filenameMatrixProbeWritableOpen started',
    );
    expectCrumb(
      3,
      'filenameMatrixProbeWritableOpen',
      'succeeded',
      'filenameMatrixProbeWritableOpen succeeded',
    );
    expectCrumb(4, 'filenameMatrixProbeWrite', 'succeeded', 'filenameMatrixProbeWrite succeeded');
    expectCrumb(5, 'filenameMatrixProbeClose', 'succeeded', 'filenameMatrixProbeClose succeeded');
    expectCrumb(6, 'filenameMatrixProbeCase', 'succeeded', 'filenameMatrixProbeCase succeeded');
    expectCrumb(7, 'filenameMatrixProbeCleanup', 'started', 'filenameMatrixProbeCleanup started');
    expectCrumb(
      8,
      'filenameMatrixProbeCleanup',
      'succeeded',
      'filenameMatrixProbeCleanup succeeded',
    );
  });

  it('adds safe breadcrumbs for filename-matrix probe case writable-open failure path', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWritableOpen',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCleanup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCleanup',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortAutomerge',
      probeFileName: 'mioframe-write-probe.automerge',
      probeFileNameLength: 30,
      errorClass: 'DOMException',
      domExceptionName: 'NotFoundError',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(3, {
      category: 'webFileSystem.write',
      data: {
        operation: 'filenameMatrixProbeWritableOpen',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'filenameMatrixProbeWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
        probeCase: 'shortAutomerge',
        probeFileName: 'mioframe-write-probe.automerge',
        probeFileNameLength: 30,
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'filenameMatrixProbeWritableOpen failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(4, {
      category: 'webFileSystem.write',
      data: {
        operation: 'filenameMatrixProbeCase',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'filenameMatrixProbeCase',
        writeStrategy: 'directCreateWriteProbe',
        probeCase: 'shortAutomerge',
        probeFileName: 'mioframe-write-probe.automerge',
        probeFileNameLength: 30,
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
      },
      level: 'warning',
      message: 'filenameMatrixProbeCase failed',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(6, {
      category: 'webFileSystem.write',
      data: {
        operation: 'filenameMatrixProbeCleanup',
        provider: 'webFileSystem',
        result: 'failed',
        step: 'filenameMatrixProbeCleanup',
        writeStrategy: 'directCreateWriteProbe',
        probeCase: 'shortAutomerge',
        probeFileName: 'mioframe-write-probe.automerge',
        probeFileNameLength: 30,
        errorClass: 'DOMException',
        domExceptionName: 'NotFoundError',
      },
      level: 'warning',
      message: 'filenameMatrixProbeCleanup failed',
    });
  });

  it('adds safe breadcrumbs for filenameMatrixProbe started and completed', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbe',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbe',
      result: 'completed',
      writeStrategy: 'directCreateWriteProbe',
    });

    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(1, {
      category: 'webFileSystem.write',
      data: {
        operation: 'filenameMatrixProbe',
        provider: 'webFileSystem',
        result: 'started',
        step: 'filenameMatrixProbe',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'filenameMatrixProbe started',
    });
    expect(addTechnicalBreadcrumb).toHaveBeenNthCalledWith(2, {
      category: 'webFileSystem.write',
      data: {
        operation: 'filenameMatrixProbe',
        provider: 'webFileSystem',
        result: 'completed',
        step: 'filenameMatrixProbe',
        writeStrategy: 'directCreateWriteProbe',
      },
      level: 'info',
      message: 'filenameMatrixProbe completed',
    });
  });

  it('breadcrumb data for matrix probe steps contains only allowed fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });

    const call = vi.mocked(addTechnicalBreadcrumb).mock.calls[0];
    const data = call?.[0]?.data ?? {};
    const allowedKeys = new Set([
      'operation',
      'provider',
      'result',
      'step',
      'writeStrategy',
      'errorClass',
      'domExceptionName',
      'targetFileName',
      'targetFileNameLength',
      'probeFileName',
      'probeCase',
      'probeFileNameLength',
    ]);
    for (const key of Object.keys(data)) {
      expect(allowedKeys).toContain(key);
    }
  });

  it('real write breadcrumbs include targetFileName basename', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWriteWritableOpen',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetFileName: 'abc123.automerge' }),
      }),
    );
  });

  it('directCreateWriteWritableOpen failed breadcrumb includes targetFileName', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWriteWritableOpen',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetFileName: 'abc123.automerge',
          domExceptionName: 'InvalidStateError',
        }),
      }),
    );
  });

  it('createdFileCleanup breadcrumbs include targetFileName', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'createdFileCleanup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'createdFileCleanup',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({ targetFileName: 'abc123.automerge' }),
      }),
    );
    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({ targetFileName: 'abc123.automerge' }),
      }),
    );
  });

  it('matrix probe breadcrumbs include probeFileName', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCase',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeWritableOpen',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'filenameMatrixProbeCleanup',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      probeCase: 'shortTmpBaseline',
      probeFileName: 'mioframe-write-probe.tmp',
      probeFileNameLength: 23,
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(3);
    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].data).toEqual(
        expect.objectContaining({ probeFileName: 'mioframe-write-probe.tmp' }),
      );
    }
  });

  it('non-write breadcrumbs (read/stat/directory) do not include filename fields', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileRead', result: 'started' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'fileStat', result: 'succeeded' });
    addWebFileSystemDiagnosticStepBreadcrumb({ step: 'directoryRead', result: 'started' });

    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].data).not.toHaveProperty('targetFileName');
      expect(call[0].data).not.toHaveProperty('probeFileName');
    }
  });

  it('fileLookup breadcrumbs include targetFileName', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileLookup',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileLookup',
      result: 'missing',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'fileLookup',
      result: 'succeeded',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(3);
    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].data).toEqual(expect.objectContaining({ targetFileName: 'abc123.automerge' }));
    }
  });

  it('directCreateWriteWritableOpen failed breadcrumb includes targetFileNameLength', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWriteWritableOpen',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
      targetFileNameLength: 16,
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          targetFileName: 'abc123.automerge',
          targetFileNameLength: 16,
          domExceptionName: 'InvalidStateError',
        }),
      }),
    );
  });

  it('directCreateWrite breadcrumbs include targetFileNameLength', () => {
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWrite',
      result: 'started',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
      targetFileNameLength: 16,
    });
    addWebFileSystemDiagnosticStepBreadcrumb({
      step: 'directCreateWrite',
      result: 'failed',
      writeStrategy: 'directCreateWriteProbe',
      targetFileName: 'abc123.automerge',
      targetFileNameLength: 16,
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });

    expect(vi.mocked(addTechnicalBreadcrumb)).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(addTechnicalBreadcrumb).mock.calls) {
      expect(call[0].data).toEqual(
        expect.objectContaining({ targetFileName: 'abc123.automerge', targetFileNameLength: 16 }),
      );
    }
  });
});
