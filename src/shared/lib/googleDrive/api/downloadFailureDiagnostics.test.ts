import { describe, expect, it } from 'vitest';
import { HttpStatusCode } from '../../error/httpStatus';
import { buildGoogleDriveDownloadFailureSafeDetails } from './downloadFailureDiagnostics';

describe('buildGoogleDriveDownloadFailureSafeDetails', () => {
  it('returns all provider fields when status, reason, and domain are available', () => {
    expect(
      buildGoogleDriveDownloadFailureSafeDetails({
        phase: 'mediaDownload',
        status: HttpStatusCode.FORBIDDEN,
        reason: 'insufficientFilePermissions',
        domain: 'global',
      }),
    ).toEqual({
      providerOperation: 'googleDrive.download',
      providerPhase: 'mediaDownload',
      providerStatus: HttpStatusCode.FORBIDDEN,
      providerReason: 'insufficientFilePermissions',
      providerDomain: 'global',
      providerRetryable: 'false',
      providerErrorCode: 'permissionDenied',
    });
  });

  it('uses null for unavailable status, reason, and domain', () => {
    expect(
      buildGoogleDriveDownloadFailureSafeDetails({
        phase: 'metadata',
        status: undefined,
        reason: undefined,
        domain: undefined,
      }),
    ).toEqual({
      providerOperation: 'googleDrive.download',
      providerPhase: 'metadata',
      providerStatus: null,
      providerReason: null,
      providerDomain: null,
      providerRetryable: 'unknown',
      providerErrorCode: 'unknown',
    });
  });

  it('drops an unsafe reason/domain token instead of leaking raw text', () => {
    const details = buildGoogleDriveDownloadFailureSafeDetails({
      phase: 'mediaDownload',
      status: HttpStatusCode.NOT_FOUND,
      reason: 'File gd-123 "Tax 2025" not found',
      domain: undefined,
    });

    expect(details.providerReason).toBeNull();
    expect(JSON.stringify(details)).not.toContain('gd-123');
  });

  it('only returns primitive values, suitable for a privacy-safe diagnostic context', () => {
    const details = buildGoogleDriveDownloadFailureSafeDetails({
      phase: 'mediaDownload',
      status: HttpStatusCode.TOO_MANY_REQUESTS,
      reason: 'rateLimitExceeded',
      domain: 'usageLimits',
    });

    Object.values(details).forEach((value) => {
      expect(['string', 'number', 'boolean', 'object']).toContain(typeof value);
      if (typeof value === 'object') {
        expect(value).toBeNull();
      }
    });
  });
});
