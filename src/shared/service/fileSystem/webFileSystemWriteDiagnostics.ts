import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const operationByStep: Record<WebFileSystemDiagnosticStep['step'], string> = {
  createFileHandle: 'createFileHandle',
  createWritable: 'openWritable',
  freshHandleRetry: 'freshHandleRetry',
  lookupExistingHandle: 'lookupExistingHandle',
  lookupParentDirectory: 'lookupParentDirectory',
};

const messageByStepResult: Record<
  WebFileSystemDiagnosticStep['step'],
  Record<WebFileSystemDiagnosticStep['result'], string | undefined>
> = {
  createFileHandle: {
    attempted: 'file handle create attempted',
    failed: 'file handle create failed',
    missing: undefined,
    started: undefined,
    succeeded: 'file handle create succeeded',
  },
  createWritable: {
    attempted: 'writable open attempted',
    failed: 'writable open failed',
    missing: undefined,
    started: undefined,
    succeeded: 'writable open succeeded',
  },
  freshHandleRetry: {
    attempted: undefined,
    failed: 'fresh handle retry failed',
    missing: undefined,
    started: 'fresh handle retry started',
    succeeded: 'fresh handle retry succeeded',
  },
  lookupExistingHandle: {
    attempted: undefined,
    failed: undefined,
    missing: 'file lookup missing',
    started: undefined,
    succeeded: 'file lookup succeeded',
  },
  lookupParentDirectory: {
    attempted: undefined,
    failed: undefined,
    missing: undefined,
    started: undefined,
    succeeded: 'parent directory lookup succeeded',
  },
};

/**
 * Maps provider-owned write milestones to narrow technical breadcrumbs.
 * @param event - Safe provider diagnostic step.
 */
export const addWebFileSystemDiagnosticStepBreadcrumb = (
  event: WebFileSystemDiagnosticStep,
): void => {
  const message = messageByStepResult[event.step][event.result];
  if (message === undefined) {
    return;
  }

  const error = event.result === 'failed' ? event.error : undefined;

  addTechnicalBreadcrumb({
    category: 'writeAccessRecovery',
    data: {
      operation: operationByStep[event.step],
      provider: 'webFileSystem',
      result: event.result,
      step: event.step,
      ...(event.writePhase !== undefined ? { writePhase: event.writePhase } : {}),
      ...(error !== undefined ? { errorClass: error.errorClass } : {}),
      ...(error?.domExceptionName !== undefined
        ? { domExceptionName: error.domExceptionName }
        : {}),
      ...(error?.errorClassification !== undefined
        ? { errorClassification: error.errorClassification }
        : {}),
    },
    level: event.result === 'failed' ? 'warning' : 'info',
    message,
  });
};
