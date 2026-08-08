import { describe, expect, it } from 'vitest';
import {
  deriveDiagnosticsPolicy,
  zodLocalSettingsDiagnosticsFields,
} from './localSettingsDiagnosticsContract';

describe('deriveDiagnosticsPolicy', () => {
  it('returns enabled when diagnosticsEnabled is true', () => {
    expect(
      deriveDiagnosticsPolicy({ diagnosticsEnabled: true, diagnosticsConsentRequested: true }),
    ).toBe('enabled');
    expect(
      deriveDiagnosticsPolicy({ diagnosticsEnabled: true, diagnosticsConsentRequested: false }),
    ).toBe('enabled');
  });

  it('returns disabled when consent was requested and not enabled', () => {
    expect(
      deriveDiagnosticsPolicy({ diagnosticsEnabled: false, diagnosticsConsentRequested: true }),
    ).toBe('disabled');
  });

  it('returns unknown when consent has never been requested', () => {
    expect(
      deriveDiagnosticsPolicy({ diagnosticsEnabled: false, diagnosticsConsentRequested: false }),
    ).toBe('unknown');
  });
});

describe('zodLocalSettingsDiagnosticsFields', () => {
  it('defaults both fields to false for an undefined/absent record', () => {
    const parsed = zodLocalSettingsDiagnosticsFields.parse(undefined);
    expect(parsed).toEqual({ diagnosticsEnabled: false, diagnosticsConsentRequested: false });
  });

  it('strips unrelated keys from a full persisted settings record', () => {
    const parsed = zodLocalSettingsDiagnosticsFields.parse({
      diagnosticsEnabled: true,
      diagnosticsConsentRequested: true,
      panesWidth: [120, 240],
      hideStarterWidget: true,
    });
    expect(parsed).toEqual({ diagnosticsEnabled: true, diagnosticsConsentRequested: true });
  });

  it('fails closed to defaults for a structurally invalid record', () => {
    const result = zodLocalSettingsDiagnosticsFields.safeParse({ diagnosticsEnabled: 'yes' });
    expect(result.success).toBe(false);
  });
});
