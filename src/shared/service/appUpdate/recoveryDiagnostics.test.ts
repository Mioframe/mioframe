import { describe, expect, it } from 'vitest';
import { buildControllerStateDbName } from './controllerState';
import {
  buildRecoveryDiagnostics,
  escapeHtml,
  serializeDiagnosticsForEmbedding,
  zodRecoveryDiagnostics,
  type RecoveryDiagnostics,
} from './recoveryDiagnostics';
import { ReleasePreparationFailureReason } from './releasePreparation';

describe('buildRecoveryDiagnostics', () => {
  it('builds the minimal diagnostic model, deriving the controller database name from the channel', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STATE_ABSENT',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'UPDATE_STATE_ABSENT',
      channel: 'stable',
      controllerDatabaseName: buildControllerStateDbName('stable'),
      timestamp: '2026-08-06T00:00:00.000Z',
    });
  });

  it('builds UPDATE_STATE_INVALID with its stable invalid-record reason as problemDetail', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STATE_INVALID',
      problemDetail: 'MALFORMED_RECORD',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'UPDATE_STATE_INVALID',
      problemDetail: 'MALFORMED_RECORD',
      channel: 'stable',
      controllerDatabaseName: buildControllerStateDbName('stable'),
      timestamp: '2026-08-06T00:00:00.000Z',
    });
  });

  it('builds UPDATE_STORAGE_UNAVAILABLE without errorName when none is available', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      channel: 'stable',
      controllerDatabaseName: buildControllerStateDbName('stable'),
      timestamp: '2026-08-06T00:00:00.000Z',
    });
  });

  it('builds UPDATE_STORAGE_UNAVAILABLE with its allowlisted errorName when provided', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      errorName: 'QuotaExceededError',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      errorName: 'QuotaExceededError',
      channel: 'stable',
      controllerDatabaseName: buildControllerStateDbName('stable'),
      timestamp: '2026-08-06T00:00:00.000Z',
    });
  });

  it('builds ACTIVE_RELEASE_UNAVAILABLE with its required problemDetail and selectedReleaseNumber', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'develop',
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      selectedReleaseNumber: 4,
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      channel: 'develop',
      controllerDatabaseName: buildControllerStateDbName('develop'),
      selectedReleaseNumber: 4,
      timestamp: '2026-08-06T00:00:00.000Z',
    });
  });

  it('rejects an invalid code/detail combination at compile time (ACTIVE_RELEASE_UNAVAILABLE carries no errorName)', () => {
    buildRecoveryDiagnostics({
      channel: 'develop',
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      selectedReleaseNumber: 4,
      // @ts-expect-error -- ACTIVE_RELEASE_UNAVAILABLE's input variant has no `errorName` field; only UPDATE_STORAGE_UNAVAILABLE does.
      errorName: 'QuotaExceededError',
    });
  });

  it('defaults to the current time when no clock is injected', () => {
    const before = Date.now();
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
    });
    const after = Date.now();

    const parsed = Date.parse(diagnostics.timestamp);
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });
});

describe('zodRecoveryDiagnostics runtime boundary validation', () => {
  it('rejects a problemDetail value outside the ControllerStateInvalidReason allowlist even if TypeScript were bypassed', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'UPDATE_STATE_INVALID',
      problemDetail: 'SOMETHING_UNEXPECTED',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an errorName value outside the storage-error allowlist even if TypeScript were bypassed', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      errorName: 'TotallyMadeUpError',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects ACTIVE_RELEASE_UNAVAILABLE missing its required selectedReleaseNumber even if TypeScript were bypassed', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a problemDetail field on UPDATE_STATE_ABSENT, which carries none', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'UPDATE_STATE_ABSENT',
      problemDetail: 'MALFORMED_RECORD',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects a problemDetail field on UPDATE_STORAGE_UNAVAILABLE, which carries none', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
      problemDetail: 'MALFORMED_RECORD',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an errorName field on ACTIVE_RELEASE_UNAVAILABLE, which carries none', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: ReleasePreparationFailureReason.INTEGRITY_FAILURE,
      selectedReleaseNumber: 4,
      errorName: 'QuotaExceededError',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
    });

    expect(result.success).toBe(false);
  });

  it.each(['UPDATE_STATE_ABSENT', 'UPDATE_STATE_INVALID', 'UPDATE_STORAGE_UNAVAILABLE'] as const)(
    'rejects a selectedReleaseNumber field on %s, which forbids it',
    (problemCode) => {
      const result = zodRecoveryDiagnostics.safeParse({
        problemCode,
        ...(problemCode === 'UPDATE_STATE_INVALID' ? { problemDetail: 'MALFORMED_RECORD' } : {}),
        selectedReleaseNumber: 4,
        channel: 'stable',
        controllerDatabaseName: 'db',
        timestamp: '2026-08-06T00:00:00.000Z',
      });

      expect(result.success).toBe(false);
    },
  );

  it('rejects an arbitrary unknown field on every variant', () => {
    const result = zodRecoveryDiagnostics.safeParse({
      problemCode: 'UPDATE_STATE_ABSENT',
      channel: 'stable',
      controllerDatabaseName: 'db',
      timestamp: '2026-08-06T00:00:00.000Z',
      unexpectedField: 'should be rejected',
    });

    expect(result.success).toBe(false);
  });
});

describe('escapeHtml', () => {
  it('escapes every HTML-significant character', () => {
    expect(escapeHtml(`<script>alert('&"')</script>`)).toBe(
      '&lt;script&gt;alert(&#39;&amp;&quot;&#39;)&lt;/script&gt;',
    );
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('MALFORMED_RECORD')).toBe('MALFORMED_RECORD');
  });
});

describe('serializeDiagnosticsForEmbedding', () => {
  it('produces valid JSON round-tripping the diagnostics', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STATE_INVALID',
      problemDetail: 'MALFORMED_RECORD',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(JSON.parse(serializeDiagnosticsForEmbedding(diagnostics))).toEqual(diagnostics);
  });

  it('never emits a raw "<" that could prematurely close a surrounding </script> tag', () => {
    // Every enum-shaped field is a stable literal union in production (the
    // builder's typed input rejects anything else), but embedding must stay
    // safe even against a RecoveryDiagnostics value whose one genuinely
    // free-form string field (`controllerDatabaseName`) happens to contain
    // the dangerous substring.
    const diagnostics: RecoveryDiagnostics = {
      problemCode: 'UPDATE_STATE_ABSENT',
      channel: 'stable',
      controllerDatabaseName: '</script><script>alert(1)</script>',
      timestamp: '2026-08-06T00:00:00.000Z',
    };

    const serialized = serializeDiagnosticsForEmbedding(diagnostics);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toMatchObject({
      controllerDatabaseName: '</script><script>alert(1)</script>',
    });
  });
});
