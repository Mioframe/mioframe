import { describe, expect, it } from 'vitest';
import {
  attachWebFileSystemWriteDiagnosticSummary,
  getWebFileSystemWriteDiagnosticSummary,
  type WebFileSystemWriteDiagnosticSummary,
} from './webFileSystemWriteDiagnosticSummary';

const summary: WebFileSystemWriteDiagnosticSummary = {
  errorClass: 'DOMException',
  domExceptionName: 'InvalidStateError',
  errorClassification: 'browserFileStateChanged',
  retryAttempted: 'true',
  retryResult: 'failed',
  writePhase: 'createWritable',
};

describe('webFileSystemWriteDiagnosticSummary', () => {
  it('stores and reads back a summary without mutating the error object', () => {
    const error = new Error('disk full');
    const beforeKeys = Reflect.ownKeys(error);

    attachWebFileSystemWriteDiagnosticSummary(error, summary);

    expect(getWebFileSystemWriteDiagnosticSummary(error)).toEqual(summary);
    expect(Reflect.ownKeys(error)).toEqual(beforeKeys);
  });

  it('does not throw for frozen or non-extensible errors', () => {
    const frozenError = Object.freeze(new Error('frozen'));
    const sealedError = Object.preventExtensions(new Error('sealed'));

    expect(() => {
      attachWebFileSystemWriteDiagnosticSummary(frozenError, summary);
    }).not.toThrow();
    expect(() => {
      attachWebFileSystemWriteDiagnosticSummary(sealedError, summary);
    }).not.toThrow();
    expect(getWebFileSystemWriteDiagnosticSummary(frozenError)).toEqual(summary);
    expect(getWebFileSystemWriteDiagnosticSummary(sealedError)).toEqual(summary);
  });

  it('ignores non-object thrown values safely', () => {
    expect(() => {
      attachWebFileSystemWriteDiagnosticSummary('raw error', summary);
    }).not.toThrow();
    expect(getWebFileSystemWriteDiagnosticSummary('raw error')).toBeUndefined();
    expect(getWebFileSystemWriteDiagnosticSummary(null)).toBeUndefined();
  });
});
