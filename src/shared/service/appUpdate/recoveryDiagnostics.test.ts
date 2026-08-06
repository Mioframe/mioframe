import { describe, expect, it } from 'vitest';
import { buildControllerStateDbName } from './controllerState';
import {
  buildRecoveryDiagnostics,
  escapeHtml,
  serializeDiagnosticsForEmbedding,
} from './recoveryDiagnostics';

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

  it('includes every optional field only when explicitly provided', () => {
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'develop',
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: 'INTEGRITY_FAILURE',
      selectedReleaseNumber: 4,
      errorName: 'QuotaExceededError',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    expect(diagnostics).toEqual({
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
      problemDetail: 'INTEGRITY_FAILURE',
      channel: 'develop',
      controllerDatabaseName: buildControllerStateDbName('develop'),
      selectedReleaseNumber: 4,
      errorName: 'QuotaExceededError',
      timestamp: '2026-08-06T00:00:00.000Z',
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
    const diagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STATE_INVALID',
      // problemDetail is a stable enum in production, but this proves the
      // embedding is safe even against a value that happens to contain the
      // dangerous substring.
      problemDetail: '</script><script>alert(1)</script>',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    const serialized = serializeDiagnosticsForEmbedding(diagnostics);
    expect(serialized).not.toContain('<');
    expect(JSON.parse(serialized)).toMatchObject({
      problemDetail: '</script><script>alert(1)</script>',
    });
  });
});
