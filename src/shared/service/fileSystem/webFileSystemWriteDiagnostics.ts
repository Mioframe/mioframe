import { addTechnicalBreadcrumb } from '@shared/lib/diagnostics';
import { sanitizePrimitiveString } from '@shared/lib/diagnostics/privacySanitizer';
import type { WebFileSystemDiagnosticStep } from '@shared/lib/webFileSystemProvider/WebFileSystemProvider';

const getSafeErrorClass = (error: unknown): string => {
  if (error instanceof DOMException) return 'DOMException';
  if (error instanceof Error) return 'Error';
  return 'unknown';
};

const getSafeDomException = (error: unknown): string | undefined =>
  error instanceof DOMException ? error.name : undefined;

const getSafeDomExceptionCode = (error: unknown): number | undefined => {
  if (!(error instanceof DOMException)) {
    return undefined;
  }

  const rawCode = Reflect.get(error, 'code');
  return typeof rawCode === 'number' && Number.isFinite(rawCode) ? rawCode : undefined;
};

const getSafeErrorDetail = (error: unknown): string | undefined => {
  if (!(error instanceof DOMException || error instanceof Error)) {
    return undefined;
  }

  return sanitizePrimitiveString(error.message);
};

const operationByStep: Record<string, string> = {
  fileHandleCreate: 'createFileHandle',
  fileWrite: 'writeFile',
  fileLookup: 'lookupExistingHandle',
  parentDirectoryLookup: 'lookupParentDirectory',
  writableOpen: 'openWritable',
};

const messageByStepResult: Record<
  string,
  Partial<Record<WebFileSystemDiagnosticStep['result'], string>>
> = {
  fileHandleCreate: {
    failed: 'file handle create failed',
    started: 'file handle create started',
    succeeded: 'file handle create succeeded',
  },
  fileWrite: {
    failed: 'file write failed',
  },
  writableOpen: {
    failed: 'writable open failed',
    started: 'writable open started',
    succeeded: 'writable open succeeded',
  },
  fileLookup: {
    missing: 'file lookup missing',
    started: 'file lookup started',
    succeeded: 'file lookup succeeded',
  },
  parentDirectoryLookup: {
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
  const message = messageByStepResult[event.step]?.[event.result];
  if (message === undefined) {
    return;
  }

  const errorClass = event.error !== undefined ? getSafeErrorClass(event.error) : undefined;
  const domException = event.error !== undefined ? getSafeDomException(event.error) : undefined;
  const domExceptionCode =
    event.error !== undefined ? getSafeDomExceptionCode(event.error) : undefined;
  const classification =
    event.step === 'writableOpen' && event.result === 'failed'
      ? 'writeStreamOpenFailed'
      : undefined;
  const errorDetail =
    classification !== undefined && event.error !== undefined
      ? getSafeErrorDetail(event.error)
      : undefined;

  addTechnicalBreadcrumb({
    category: 'webFileSystem.write',
    data: {
      operation: operationByStep[event.step] ?? event.step,
      provider: 'webFileSystem',
      result: event.result,
      step: event.step,
      ...(classification !== undefined ? { classification } : {}),
      ...(errorClass !== undefined ? { errorClass } : {}),
      ...(domException !== undefined ? { domException } : {}),
      ...(domExceptionCode !== undefined ? { domExceptionCode } : {}),
      ...(errorDetail !== undefined ? { errorDetail } : {}),
    },
    level: event.result === 'failed' ? 'warning' : 'info',
    message,
  });
};
