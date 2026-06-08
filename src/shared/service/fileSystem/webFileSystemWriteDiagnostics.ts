import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const operationByStep: Record<string, string> = {
  filenameMatrixProbe: 'filenameMatrixProbe',
  filenameMatrixProbeCase: 'filenameMatrixProbeCase',
  filenameMatrixProbeWritableOpen: 'filenameMatrixProbeWritableOpen',
  filenameMatrixProbeWrite: 'filenameMatrixProbeWrite',
  filenameMatrixProbeClose: 'filenameMatrixProbeClose',
  filenameMatrixProbeCleanup: 'filenameMatrixProbeCleanup',
  createdFileCleanup: 'cleanupCreatedFile',
  directoryRead: 'readDirectory',
  directCreateWrite: 'directCreateWrite',
  directCreateWriteWritableOpen: 'directCreateWriteWritableOpen',
  fileHandleCreate: 'createFileHandle',
  fileHandleLookupAfterCreate: 'lookupHandleAfterCreate',
  fileRead: 'readFile',
  fileStat: 'statFileHandle',
  fileWrite: 'writeFile',
  freshHandleRetry: 'freshHandleRetry',
  fileLookup: 'lookupExistingHandle',
  parentDirectoryLookup: 'lookupParentDirectory',
  writeStrategySelected: 'writeStrategySelected',
  writableCompatibilityOpen: 'openWritableCompatibility',
  writableOpen: 'openWritable',
};

const messageByStepResult: Record<
  string,
  Partial<Record<WebFileSystemDiagnosticStep['result'], string>>
> = {
  filenameMatrixProbe: {
    started: 'filenameMatrixProbe started',
    completed: 'filenameMatrixProbe completed',
  },
  filenameMatrixProbeCase: {
    started: 'filenameMatrixProbeCase started',
    succeeded: 'filenameMatrixProbeCase succeeded',
    failed: 'filenameMatrixProbeCase failed',
  },
  filenameMatrixProbeWritableOpen: {
    started: 'filenameMatrixProbeWritableOpen started',
    succeeded: 'filenameMatrixProbeWritableOpen succeeded',
    failed: 'filenameMatrixProbeWritableOpen failed',
  },
  filenameMatrixProbeWrite: {
    succeeded: 'filenameMatrixProbeWrite succeeded',
  },
  filenameMatrixProbeClose: {
    succeeded: 'filenameMatrixProbeClose succeeded',
  },
  filenameMatrixProbeCleanup: {
    started: 'filenameMatrixProbeCleanup started',
    succeeded: 'filenameMatrixProbeCleanup succeeded',
    failed: 'filenameMatrixProbeCleanup failed',
  },
  fileHandleCreate: {
    failed: 'file handle create failed',
    started: 'file handle create started',
    succeeded: 'file handle create succeeded',
  },
  fileHandleLookupAfterCreate: {
    failed: 'file handle lookup after create failed',
    started: 'file handle lookup after create started',
    succeeded: 'file handle lookup after create succeeded',
  },
  fileWrite: {
    failed: 'file write failed',
  },
  fileRead: {
    failed: 'file read failed',
    started: 'file read started',
    succeeded: 'file read succeeded',
  },
  fileStat: {
    failed: 'file stat failed',
    started: 'file stat started',
    succeeded: 'file stat succeeded',
  },
  createdFileCleanup: {
    failed: 'created file cleanup failed',
    started: 'created file cleanup started',
    succeeded: 'created file cleanup succeeded',
  },
  directCreateWrite: {
    failed: 'direct create write failed',
    started: 'direct create write started',
    succeeded: 'direct create write succeeded',
  },
  directCreateWriteWritableOpen: {
    failed: 'direct create write writable open failed',
    started: 'direct create write writable open started',
    succeeded: 'direct create write writable open succeeded',
  },
  directoryRead: {
    failed: 'directory read failed',
    started: 'directory read started',
    succeeded: 'directory read succeeded',
  },
  writableOpen: {
    failed: 'writable open failed',
    started: 'writable open started',
    succeeded: 'writable open succeeded',
  },
  writableCompatibilityOpen: {
    failed: 'writable compatibility open failed',
    started: 'writable compatibility open started',
    succeeded: 'writable compatibility open succeeded',
  },
  freshHandleRetry: {
    failed: 'fresh handle retry failed',
    started: 'fresh handle retry started',
    succeeded: 'fresh handle retry succeeded',
  },
  fileLookup: {
    missing: 'file lookup missing',
    started: 'file lookup started',
    succeeded: 'file lookup succeeded',
  },
  parentDirectoryLookup: {
    succeeded: 'parent directory lookup succeeded',
  },
  writeStrategySelected: {
    directCreateWriteProbe: 'write strategy selected',
    safeCurrent: 'write strategy selected',
  },
};

/**
 * Maps provider-owned write milestones to narrow technical breadcrumbs.
 * @param event - Safe provider diagnostic step.
 */
export const addWebFileSystemDiagnosticStepBreadcrumb = (
  event: WebFileSystemDiagnosticStep,
): void => {
  const message = messageByStepResult[event.step]?.[event.result];
  if (message === undefined) {
    return;
  }

  const categoryByStep: Partial<
    Record<
      string,
      | 'webFileSystem.directory'
      | 'webFileSystem.read'
      | 'webFileSystem.stat'
      | 'webFileSystem.write'
    >
  > = {
    directoryRead: 'webFileSystem.directory',
    fileRead: 'webFileSystem.read',
    fileStat: 'webFileSystem.stat',
  };

  addTechnicalBreadcrumb({
    category: categoryByStep[event.step] ?? 'webFileSystem.write',
    data: {
      operation: operationByStep[event.step] ?? event.step,
      provider: 'webFileSystem',
      result: event.result,
      step: event.step,
      ...(event.writeStrategy !== undefined ? { writeStrategy: event.writeStrategy } : {}),
      ...(event.errorClass !== undefined ? { errorClass: event.errorClass } : {}),
      ...(event.domExceptionName !== undefined ? { domExceptionName: event.domExceptionName } : {}),
      // TODO(PR #85): temporary — basename fields for Android InvalidStateError filename-pattern diagnosis; remove after investigation
      ...(event.targetFileName !== undefined ? { targetFileName: event.targetFileName } : {}),
      ...(event.targetFileNameLength !== undefined
        ? { targetFileNameLength: event.targetFileNameLength }
        : {}),
      ...(event.probeFileName !== undefined ? { probeFileName: event.probeFileName } : {}),
      ...(event.probeCase !== undefined ? { probeCase: event.probeCase } : {}),
      ...(event.probeFileNameLength !== undefined
        ? { probeFileNameLength: event.probeFileNameLength }
        : {}),
    },
    level: event.result === 'failed' ? 'warning' : 'info',
    message,
  });
};
