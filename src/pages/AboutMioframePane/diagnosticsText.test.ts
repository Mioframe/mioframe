import { describe, expect, it } from 'vitest';
import { getDiagnosticsText, getPlatformFromUserAgentData } from './diagnosticsText';

describe('getDiagnosticsText', () => {
  const baseInput = {
    appName: 'Mioframe',
    appVersion: '0.0.1',
    appBuildDate: '2026-05-15T12:34:56.000Z',
    appBuildId: 'sha-1234567',
    diagnosticsAvailable: true,
    diagnosticsEnabled: true,
    googleDriveAvailable: true,
    userAgent: 'unit-test-agent/1.0',
    platform: 'UnitTestOS',
  };

  it('includes all fields when every value is present', () => {
    const text = getDiagnosticsText(baseInput);

    expect(text).toBe(
      [
        'App: Mioframe',
        'Version: 0.0.1',
        'Build date: 2026-05-15T12:34:56.000Z',
        'Build id: sha-1234567',
        'Diagnostics available: yes',
        'Diagnostics enabled: yes',
        'Google Drive available: yes',
        'Browser: unit-test-agent/1.0',
        'Platform: UnitTestOS',
      ].join('\n'),
    );
  });

  it('omits the build id line when appBuildId is absent', () => {
    const text = getDiagnosticsText({ ...baseInput, appBuildId: undefined });

    expect(text).not.toContain('Build id:');
  });

  it('omits the platform line when platform is absent', () => {
    const text = getDiagnosticsText({ ...baseInput, platform: undefined });

    expect(text).not.toContain('Platform:');
  });

  it('reports diagnostics as unavailable and disabled', () => {
    const text = getDiagnosticsText({
      ...baseInput,
      diagnosticsAvailable: false,
      diagnosticsEnabled: false,
    });

    expect(text).toContain('Diagnostics available: no');
    expect(text).toContain('Diagnostics enabled: no');
  });

  it('reports Google Drive as unavailable', () => {
    const text = getDiagnosticsText({ ...baseInput, googleDriveAvailable: false });

    expect(text).toContain('Google Drive available: no');
  });
});

describe('getPlatformFromUserAgentData', () => {
  it('returns the platform string when present', () => {
    expect(getPlatformFromUserAgentData({ platform: 'PrototypeOS' })).toBe('PrototypeOS');
  });

  it('returns undefined when userAgentData is absent', () => {
    expect(getPlatformFromUserAgentData(undefined)).toBeUndefined();
  });

  it('returns undefined when userAgentData is not an object', () => {
    expect(getPlatformFromUserAgentData('not-an-object')).toBeUndefined();
  });

  it('returns undefined when platform is an empty string', () => {
    expect(getPlatformFromUserAgentData({ platform: '' })).toBeUndefined();
  });

  it('returns undefined when platform is not a string', () => {
    expect(getPlatformFromUserAgentData({ platform: 42 })).toBeUndefined();
  });
});
