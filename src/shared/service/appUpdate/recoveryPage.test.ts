import { describe, expect, it } from 'vitest';
import { buildRecoveryDiagnostics } from './recoveryDiagnostics';
import { buildRecoveryPageHtml, buildRecoveryPageResponse } from './recoveryPage';

const stateLossDiagnostics = buildRecoveryDiagnostics({
  channel: 'stable',
  problemCode: 'UPDATE_STATE_ABSENT',
  now: () => '2026-08-06T00:00:00.000Z',
});

const invalidStateDiagnostics = buildRecoveryDiagnostics({
  channel: 'stable',
  problemCode: 'UPDATE_STATE_INVALID',
  problemDetail: 'MALFORMED_RECORD',
  now: () => '2026-08-06T00:00:00.000Z',
});

const activeUnavailableDiagnostics = buildRecoveryDiagnostics({
  channel: 'develop',
  problemCode: 'ACTIVE_RELEASE_UNAVAILABLE',
  problemDetail: 'INTEGRITY_FAILURE',
  selectedReleaseNumber: 7,
  now: () => '2026-08-06T00:00:00.000Z',
});

describe('buildRecoveryPageResponse', () => {
  it('returns a 503 with the required headers', async () => {
    const response = buildRecoveryPageResponse(stateLossDiagnostics);

    expect(response.status).toBe(503);
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8');
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.text()).toContain('<h1 id="recovery-heading">');
  });
});

describe('buildRecoveryPageHtml', () => {
  it('has a visible heading and a semantic live status region', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('<h1 id="recovery-heading">Update recovery needed</h1>');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it('provides the three required, keyboard-operable, accessibly named actions', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('<button type="button" id="retry-button">Retry</button>');
    expect(html).toContain(
      '<button type="button" id="install-latest-button">Install latest version</button>',
    );
    expect(html).toContain(
      '<button type="button" id="copy-diagnostics-button">Copy diagnostic details</button>',
    );
  });

  it('is mobile-compatible: declares a responsive viewport and no fixed desktop-only widths', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('name="viewport" content="width=device-width, initial-scale=1"');
  });

  it('declares visible-focus styling for interactive elements', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toMatch(/button:focus-visible\s*{[^}]*outline/);
  });

  it('never loads an external asset: no <link>, <script src>, or remote <img>', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).not.toContain('<link');
    expect(html).not.toMatch(/<script[^>]+src=/);
    expect(html).not.toContain('<img');
  });

  it('states that recovery does not delete Mioframe user data, and does not overclaim unrelated storage health', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('never deletes, migrates, or rolls back any of');
    expect(html).not.toMatch(/all (of )?your data (is|remains) (safe|intact)/i);
  });

  it('warns about untrusted mode/version and the Automatic reset for the state-loss group', () => {
    for (const diagnostics of [
      stateLossDiagnostics,
      invalidStateDiagnostics,
      buildRecoveryDiagnostics({
        channel: 'stable',
        problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
        now: () => '2026-08-06T00:00:00.000Z',
      }),
    ]) {
      const html = buildRecoveryPageHtml(diagnostics);
      expect(html).toContain('cannot be trusted');
      expect(html).toContain('resets update mode to Automatic');
    }
  });

  it('explains restoration/scheduling for the known-active-unavailable case, distinct from the state-loss group', () => {
    const html = buildRecoveryPageHtml(activeUnavailableDiagnostics);

    expect(html).toContain('previously selected release could not be restored');
    expect(html).toContain('does not switch to it immediately');
    expect(html).not.toContain('resets update mode to Automatic');
  });

  it('escapes every injected diagnostic value in the visible markup', () => {
    const maliciousDiagnostics = buildRecoveryDiagnostics({
      channel: 'stable',
      problemCode: 'UPDATE_STATE_INVALID',
      problemDetail: '<script>alert(1)</script>',
      now: () => '2026-08-06T00:00:00.000Z',
    });

    const html = buildRecoveryPageHtml(maliciousDiagnostics);

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('embeds the diagnostics as safely-escaped JSON for the page-local Copy action', () => {
    const html = buildRecoveryPageHtml(activeUnavailableDiagnostics);

    expect(html).toContain('id="diagnostics-data"');
    const match =
      /<script type="application\/json" id="diagnostics-data">([\s\S]*?)<\/script>/.exec(html);
    if (!match) throw new Error('Expected the diagnostics-data script tag to be present');
    const parsed = JSON.parse(match[1] ?? '');
    expect(parsed).toEqual(activeUnavailableDiagnostics);
  });

  it('shows "unknown" for an absent selected release number, and the exact number when known', () => {
    expect(buildRecoveryPageHtml(stateLossDiagnostics)).toContain('<dd>unknown</dd>');
    expect(buildRecoveryPageHtml(activeUnavailableDiagnostics)).toContain('<dd>7</dd>');
  });

  it('embeds the exact private protocol version and RECOVER_INSTALL_LATEST message type used by the request', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('var PROTOCOL_VERSION = 1;');
    expect(html).toContain('var RECOVER_TYPE = "RECOVER_INSTALL_LATEST";');
  });

  it('uses the documented 120-second page-local command timeout', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).toContain('var TIMEOUT_MS = 120000;');
  });
});
