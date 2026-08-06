import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildRecoveryDiagnostics, type RecoveryDiagnostics } from './recoveryDiagnostics';
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

  it('warns about untrusted mode/version and the guaranteed Automatic reset for confirmed state loss (absent/invalid)', () => {
    for (const diagnostics of [stateLossDiagnostics, invalidStateDiagnostics]) {
      const html = buildRecoveryPageHtml(diagnostics);
      expect(html).toContain('cannot be trusted');
      expect(html).toContain('resets update mode to Automatic');
    }
  });

  it('never promises a guaranteed baseline reset for UPDATE_STORAGE_UNAVAILABLE, since storage may still turn out to be readable', () => {
    const html = buildRecoveryPageHtml(
      buildRecoveryDiagnostics({
        channel: 'stable',
        problemCode: 'UPDATE_STORAGE_UNAVAILABLE',
        now: () => '2026-08-06T00:00:00.000Z',
      }),
    );

    expect(html).not.toContain('cannot be trusted');
    expect(html).not.toContain('resets update mode to Automatic');
    expect(html).toContain('re-check update storage');
    expect(html).toContain('may only be');
  });

  it('explains restoration/scheduling for the known-active-unavailable case, distinct from the state-loss group', () => {
    const html = buildRecoveryPageHtml(activeUnavailableDiagnostics);

    expect(html).toContain('previously selected release could not be restored');
    expect(html).toContain('does not switch to it immediately');
    expect(html).not.toContain('resets update mode to Automatic');
  });

  it('escapes every injected diagnostic value in the visible markup', () => {
    // Every enum-shaped field is a stable literal union in production (the
    // builder's typed input rejects anything else); this proves rendering
    // stays safe even against a RecoveryDiagnostics value whose one
    // genuinely free-form string field (`controllerDatabaseName`) reached
    // this defense-in-depth boundary containing markup.
    const maliciousDiagnostics: RecoveryDiagnostics = {
      problemCode: 'UPDATE_STATE_ABSENT',
      channel: 'stable',
      controllerDatabaseName: '<script>alert(1)</script>',
      timestamp: '2026-08-06T00:00:00.000Z',
    };

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

  it('never claims a generic "latest version installed": success wording must stay true for every successful outcome (fresh baseline, exact restore, or newer ready candidate)', () => {
    const html = buildRecoveryPageHtml(stateLossDiagnostics);

    expect(html).not.toContain('Latest version installed');
    expect(html).toContain('Update recovery finished successfully');
  });
});

/**
 * Extracts the `<body>…</body>` markup from a complete recovery page
 * document, so a test can insert it into the real (happy-dom) document
 * without the surrounding `<html>`/`<head>` wrapper.
 * @param html - The complete recovery page document.
 * @returns The body's inner markup.
 */
function extractBodyMarkup(html: string): string {
  const match = /<body>([\s\S]*)<\/body>/.exec(html);
  if (!match?.[1]) throw new Error('Expected a <body> section');
  return match[1];
}

/**
 * Extracts the main interactive inline `<script>…</script>` block (as
 * opposed to the `application/json` diagnostics-data script) from a complete
 * recovery page document's source text: both its full tag-inclusive text
 * (so a caller can strip it out of markup destined for `innerHTML`, since a
 * happy-dom-parsed `<script>` element executes on insertion just like a real
 * browser's `document.write`/`insertAdjacentHTML` would — this script must
 * run exactly once, under this test's own explicit control) and its inner
 * source text (to execute deliberately via `new Function`).
 * @param html - The complete recovery page document.
 * @returns The full matched block and its inner script source text.
 */
function extractMainScriptBlock(html: string): { fullBlock: string; scriptText: string } {
  const matches = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
  const match = matches.find((candidate) =>
    (candidate[1] ?? '').includes('installButton.addEventListener'),
  );
  if (!match) throw new Error('Expected to find the main inline recovery script');
  return { fullBlock: match[0], scriptText: match[1] ?? '' };
}

/** A `MessagePort`-shaped value the recovery script's transport can send to or close. */
type PortLike = { postMessage: (data: unknown) => void; close: () => void };

/**
 * A synchronous in-memory fake `MessageChannel`/`MessagePort` pair that also
 * records every `close()` call and every constructed channel instance — real
 * `MessagePort.close()` has no externally observable effect, so proving
 * "closes both owned ports" needs a tracked fake, not the real browser API.
 * @returns A fresh fake `MessageChannel` class plus its shared close/instance logs.
 */
function createTrackedMessageChannel(): {
  TrackedMessageChannel: new () => { port1: PortLike; port2: PortLike };
  closedPorts: PortLike[];
  instances: Array<{ port1: PortLike; port2: PortLike }>;
} {
  const closedPorts: PortLike[] = [];
  const instances: Array<{ port1: PortLike; port2: PortLike }> = [];

  class TrackedPort implements PortLike {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    peer: TrackedPort | undefined;
    postMessage(data: unknown): void {
      this.peer?.onmessage?.({ data });
    }
    close(): void {
      closedPorts.push(this);
    }
  }

  class TrackedMessageChannel {
    port1 = new TrackedPort();
    port2 = new TrackedPort();
    constructor() {
      this.port1.peer = this.port2;
      this.port2.peer = this.port1;
      instances.push(this);
    }
  }

  return { TrackedMessageChannel, closedPorts, instances };
}

/**
 * Renders `diagnostics` and executes the recovery page's own inline main
 * script against the real (happy-dom) document, exactly as a browser would:
 * proves actual runtime behavior, not merely the generated source text.
 * @param diagnostics - The diagnostic model to render and run.
 */
function renderAndRunRecoveryScript(diagnostics: RecoveryDiagnostics): void {
  const html = buildRecoveryPageHtml(diagnostics);
  const { fullBlock, scriptText } = extractMainScriptBlock(html);
  // Insert only the diagnostics-data script and visible markup — never the
  // executable main script itself, which this function runs exactly once
  // under its own explicit control below.
  document.body.innerHTML = extractBodyMarkup(html).replace(fullBlock, '');
  // oxlint-disable-next-line no-implied-eval -- runs the built recovery-page source in isolation to prove real runtime behavior, not user input.
  new Function(scriptText)();
}

function getInstallButton(): HTMLButtonElement {
  const button = document.getElementById('install-latest-button');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected the install button');
  return button;
}

function getRetryButton(): HTMLButtonElement {
  const button = document.getElementById('retry-button');
  if (!(button instanceof HTMLButtonElement)) throw new Error('Expected the retry button');
  return button;
}

function getStatusText(): string {
  return document.getElementById('status-region')?.textContent ?? '';
}

function getRecoveryActionText(): string {
  return document.getElementById('diagnostic-recovery-action')?.textContent ?? '';
}

/**
 * Stubs `navigator` with a controller whose `postMessage` runs `onPostMessage`.
 * @param onPostMessage - Runs synchronously for every `postMessage()` call the recovery script makes to the controller.
 */
function stubControllerPostMessage(
  onPostMessage: (message: unknown, transfer: readonly PortLike[]) => void,
): void {
  vi.stubGlobal('navigator', {
    serviceWorker: { controller: { postMessage: onPostMessage } },
  });
}

describe('interactive recovery script (executable behavior)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('handles a successful response: reports the outcome-neutral success message and reloads', () => {
    const { TrackedMessageChannel, closedPorts } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    stubControllerPostMessage((_message, transfer) => {
      transfer[0]?.postMessage({ protocolVersion: 1, result: 'success' });
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();

    expect(getStatusText()).toContain('Update recovery finished successfully');
    expect(getRecoveryActionText()).toBe('success');
    expect(reload).toHaveBeenCalledTimes(1);
    expect(closedPorts.length).toBeGreaterThan(0);
  });

  it('handles a known non-success response: shows its stable message and restores busy state, without reloading', () => {
    const { TrackedMessageChannel } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    stubControllerPostMessage((_message, transfer) => {
      transfer[0]?.postMessage({ protocolVersion: 1, result: 'controller-storage-unavailable' });
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();

    expect(getStatusText()).toContain('Update storage is unavailable right now');
    expect(getRecoveryActionText()).toBe('controller-storage-unavailable');
    expect(reload).not.toHaveBeenCalled();
    expect(getInstallButton().disabled).toBe(false);
    expect(getRetryButton().disabled).toBe(false);
  });

  it.each([
    ['a wrong protocol version', { protocolVersion: 2, result: 'success' }],
    [
      'an unknown result code outside the allowlist',
      { protocolVersion: 1, result: 'not-a-real-code' },
    ],
    ['a non-string result', { protocolVersion: 1, result: 42 }],
  ] as const)(
    'treats %s as an unexpected response: restores busy state and never reloads',
    (_label, response) => {
      const { TrackedMessageChannel } = createTrackedMessageChannel();
      vi.stubGlobal('MessageChannel', TrackedMessageChannel);
      const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
      stubControllerPostMessage((_message, transfer) => {
        transfer[0]?.postMessage(response);
      });

      renderAndRunRecoveryScript(stateLossDiagnostics);
      getInstallButton().click();

      expect(getStatusText()).toContain('Received an unexpected response');
      expect(getRecoveryActionText()).toBe('error');
      expect(reload).not.toHaveBeenCalled();
      expect(getInstallButton().disabled).toBe(false);
    },
  );

  it('catches a synchronous postMessage failure: restores busy state and permits retry', () => {
    stubControllerPostMessage(() => {
      throw new Error('postMessage failed');
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();

    expect(getStatusText()).toContain('Could not send the recovery request');
    expect(getRecoveryActionText()).toBe('error');
    expect(getInstallButton().disabled).toBe(false);
  });

  it('times out after the documented 120-second interval: restores busy state, closes ports, and never sends a second (cancellation) message', () => {
    vi.useFakeTimers();
    const { TrackedMessageChannel, closedPorts, instances } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const postMessage = vi.fn();
    stubControllerPostMessage(postMessage);

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();
    expect(getInstallButton().disabled).toBe(true);

    vi.advanceTimersByTime(120_000);

    expect(getStatusText()).toContain('timed out');
    expect(getRecoveryActionText()).toBe('timed-out');
    expect(getInstallButton().disabled).toBe(false);
    expect(postMessage).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(1);
    expect(closedPorts).toContain(instances[0]?.port1);
    expect(closedPorts).toContain(instances[0]?.port2);
  });

  it('ignores a late response that arrives after the timeout already settled the attempt', () => {
    vi.useFakeTimers();
    const { TrackedMessageChannel } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    let capturedPort: PortLike | undefined;
    stubControllerPostMessage((_message, transfer) => {
      capturedPort = transfer[0];
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();
    vi.advanceTimersByTime(120_000);
    const statusAfterTimeout = getStatusText();
    const recoveryActionAfterTimeout = getRecoveryActionText();

    capturedPort?.postMessage({ protocolVersion: 1, result: 'success' });

    expect(getStatusText()).toBe(statusAfterTimeout);
    expect(getRecoveryActionText()).toBe(recoveryActionAfterTimeout);
    expect(reload).not.toHaveBeenCalled();
  });

  it('permits a clean retry after a timeout: a second click starts a brand-new attempt that can still succeed', () => {
    vi.useFakeTimers();
    const { TrackedMessageChannel, instances } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const posted: unknown[] = [];
    stubControllerPostMessage((message, transfer) => {
      posted.push(message);
      if (posted.length === 2) transfer[0]?.postMessage({ protocolVersion: 1, result: 'success' });
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();
    vi.advanceTimersByTime(120_000);
    expect(getInstallButton().disabled).toBe(false);

    getInstallButton().click();

    expect(posted).toHaveLength(2);
    expect(instances).toHaveLength(2);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('permits a clean retry after a synchronous postMessage failure', () => {
    const { TrackedMessageChannel } = createTrackedMessageChannel();
    vi.stubGlobal('MessageChannel', TrackedMessageChannel);
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    let attempt = 0;
    stubControllerPostMessage((_message, transfer) => {
      attempt += 1;
      if (attempt === 1) throw new Error('postMessage failed');
      transfer[0]?.postMessage({ protocolVersion: 1, result: 'success' });
    });

    renderAndRunRecoveryScript(stateLossDiagnostics);
    getInstallButton().click();
    expect(getInstallButton().disabled).toBe(false);

    getInstallButton().click();

    expect(attempt).toBe(2);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  describe('copy diagnostic details', () => {
    it('copies via the Clipboard API when it is available', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: undefined },
        clipboard: { writeText },
      });

      renderAndRunRecoveryScript(activeUnavailableDiagnostics);
      document.getElementById('copy-diagnostics-button')?.dispatchEvent(new Event('click'));
      await Promise.resolve();
      await Promise.resolve();

      expect(writeText).toHaveBeenCalledTimes(1);
      expect(String(writeText.mock.calls[0]?.[0])).toContain(
        'Problem code: ACTIVE_RELEASE_UNAVAILABLE',
      );
      expect(getStatusText()).toBe('Diagnostic details copied.');
    });

    it('falls back to document.execCommand when the Clipboard API is unavailable, and reports success', () => {
      vi.stubGlobal('navigator', { serviceWorker: { controller: undefined } });
      const execCommand = vi.fn().mockReturnValue(true);
      // oxlint-disable-next-line no-restricted-syntax -- deliberately stubbing execCommand for this isolated fallback-path test.
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- deliberately stubbing the deprecated execCommand fallback the production code itself still uses when the Clipboard API is unavailable.
      document.execCommand = execCommand;

      renderAndRunRecoveryScript(stateLossDiagnostics);
      document.getElementById('copy-diagnostics-button')?.dispatchEvent(new Event('click'));

      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(getStatusText()).toBe('Diagnostic details copied.');
    });

    it('reports failure, and still removes the temporary textarea, when execCommand returns false', () => {
      vi.stubGlobal('navigator', { serviceWorker: { controller: undefined } });
      const execCommand = vi.fn().mockReturnValue(false);
      // oxlint-disable-next-line no-restricted-syntax -- deliberately stubbing execCommand for this isolated fallback-path test.
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- deliberately stubbing the deprecated execCommand fallback the production code itself still uses when the Clipboard API is unavailable.
      document.execCommand = execCommand;

      renderAndRunRecoveryScript(stateLossDiagnostics);
      document.getElementById('copy-diagnostics-button')?.dispatchEvent(new Event('click'));

      expect(execCommand).toHaveBeenCalledWith('copy');
      expect(getStatusText()).toBe('Could not copy diagnostic details.');
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('reports failure when the Clipboard API rejects and the execCommand fallback also throws', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('denied'));
      vi.stubGlobal('navigator', {
        serviceWorker: { controller: undefined },
        clipboard: { writeText },
      });
      // oxlint-disable-next-line no-restricted-syntax -- deliberately stubbing execCommand for this isolated fallback-path test.
      // eslint-disable-next-line @typescript-eslint/no-deprecated -- deliberately stubbing the deprecated execCommand fallback the production code itself still uses when the Clipboard API is unavailable.
      document.execCommand = vi.fn(() => {
        throw new Error('exec failed');
      });

      renderAndRunRecoveryScript(stateLossDiagnostics);
      document.getElementById('copy-diagnostics-button')?.dispatchEvent(new Event('click'));
      await Promise.resolve();
      await Promise.resolve();

      expect(getStatusText()).toBe('Could not copy diagnostic details.');
    });
  });
});
