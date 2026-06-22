import { describe, expect, it } from 'vitest';
import { getSafeDiagnosticDetails, type SafeDiagnosticDetails } from './safeDiagnosticDetails';

class ErrorWithSafeDetails extends Error {
  safeDetails: SafeDiagnosticDetails;

  constructor(safeDetails: SafeDiagnosticDetails) {
    super('boom');
    this.safeDetails = safeDetails;
  }
}

describe('getSafeDiagnosticDetails', () => {
  it('returns undefined when the error carries no safe details', () => {
    expect(getSafeDiagnosticDetails(new Error('boom'))).toBeUndefined();
  });

  it('returns undefined for non-error values', () => {
    expect(getSafeDiagnosticDetails('not an error')).toBeUndefined();
    expect(getSafeDiagnosticDetails(undefined)).toBeUndefined();
  });

  it('reads safe details attached directly to the error', () => {
    const error = new ErrorWithSafeDetails({ providerStatus: 404 });

    expect(getSafeDiagnosticDetails(error)).toEqual({ providerStatus: 404 });
  });

  it('reads safe details attached to the direct cause, one level deep', () => {
    const cause = new ErrorWithSafeDetails({ providerStatus: 403 });
    const wrapper = new Error('wrapped', { cause });

    expect(getSafeDiagnosticDetails(wrapper)).toEqual({ providerStatus: 403 });
  });

  it('does not look more than one level into the cause chain', () => {
    const deepCause = new ErrorWithSafeDetails({ providerStatus: 500 });
    const middle = new Error('middle', { cause: deepCause });
    const outer = new Error('outer', { cause: middle });

    expect(getSafeDiagnosticDetails(outer)).toBeUndefined();
  });

  it('ignores a malformed safeDetails value that is not a flat primitive record', () => {
    class ErrorWithMalformedDetails extends Error {
      safeDetails: unknown = { nested: { not: 'allowed' } };
    }

    expect(getSafeDiagnosticDetails(new ErrorWithMalformedDetails('boom'))).toBeUndefined();
  });
});
