import {
  APP_UPDATE_PROTOCOL_MESSAGE_TYPES,
  APP_UPDATE_PROTOCOL_VERSION,
  type RecoverInstallLatestResultCode,
} from './protocol';
import {
  escapeHtml,
  serializeDiagnosticsForEmbedding,
  type RecoveryDiagnostics,
} from './recoveryDiagnostics';

/**
 * The recovery page's own client-side timeout for a `RECOVER_INSTALL_LATEST`
 * round trip (see the managed pinned application updates architecture,
 * "Recovery protocol and timeout"). Clears only this page's own local busy
 * state on expiry — it never cancels the worker's own in-progress recovery
 * attempt, and a late response arriving after this timeout must not mutate
 * the timed-out page's own state.
 */
export const RECOVERY_COMMAND_TIMEOUT_MS = 120_000;

const STATE_LOSS_PROBLEM_CODES = new Set([
  'UPDATE_STATE_ABSENT',
  'UPDATE_STATE_INVALID',
  'UPDATE_STORAGE_UNAVAILABLE',
]);

/**
 * Builds the scenario-specific explanatory copy shown above the recovery
 * actions: the state-loss group (absent/invalid/unreadable controller state)
 * warns that no previous version or update mode can be trusted, while
 * `ACTIVE_RELEASE_UNAVAILABLE` explains that the previously selected release
 * merely could not be restored and describes each action's actual effect.
 * @param diagnostics - The current recovery diagnostic model.
 * @returns HTML-safe explanatory paragraph text (no wrapping tag).
 */
function buildProblemExplanation(diagnostics: RecoveryDiagnostics): string {
  if (STATE_LOSS_PROBLEM_CODES.has(diagnostics.problemCode)) {
    return (
      'This channel’s update information could not be read, so the previously selected ' +
      'version and update mode cannot be trusted. Installing the latest version resets update ' +
      'mode to Automatic and starts a brand-new baseline release — there is no older trusted ' +
      'version to fall back to. If this new baseline cannot start, a corrected newer release ' +
      'remains discoverable automatically the next time this app is opened.'
    );
  }
  return (
    'Your previously selected release could not be restored from its local copy. Retry attempts ' +
    'to restore it again. Installing the latest version does not switch to it immediately — it ' +
    'is scheduled to activate the next time this app can safely restart, and your current ' +
    'release selection is unchanged until then.'
  );
}

/** Human-readable, non-technical text for every {@link RecoverInstallLatestResultCode}, shown in the status region after a command completes. */
const RESULT_MESSAGES: Record<RecoverInstallLatestResultCode, string> = {
  success: 'Latest version installed. Reloading…',
  'state-changed':
    'Update state changed in another window. Reloading to pick up the current state…',
  'controller-storage-unavailable': 'Update storage is unavailable right now. You may retry.',
  'network-or-latest-unavailable':
    'The latest release information could not be reached. You may retry.',
  'invalid-latest-metadata': 'The latest release information is invalid. You may retry later.',
  'latest-older-than-active':
    'The latest published release is not newer than your current release.',
  'conflicting-release-identity':
    'The latest release information conflicts with a release already known here.',
  'release-preparation-failed':
    'The latest release could not be downloaded or verified. You may retry.',
  'controller-state-persistence-failed': 'The recovery result could not be saved. You may retry.',
};

/**
 * Renders the complete self-contained recovery HTML document: no Vue
 * application, no external assets, one inline `<style>` and one inline
 * `<script>`. The diagnostic model is embedded twice: escaped into visible
 * markup for a sighted/screen-reader user, and as JSON (see
 * {@link serializeDiagnosticsForEmbedding}) for the page's own "Copy
 * diagnostic details" action.
 * @param diagnostics - The complete safe diagnostic model for this render.
 * @returns The recovery page's HTML document text.
 */
export function buildRecoveryPageHtml(diagnostics: RecoveryDiagnostics): string {
  const problemDetail = diagnostics.problemDetail ?? 'none';
  const selectedReleaseNumber =
    diagnostics.selectedReleaseNumber === undefined
      ? 'unknown'
      : String(diagnostics.selectedReleaseNumber);
  const errorName = diagnostics.errorName ?? 'none';
  const diagnosticsJson = serializeDiagnosticsForEmbedding(diagnostics);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Update recovery needed</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 1.5rem 1rem 3rem;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    line-height: 1.5;
    background: Canvas;
    color: CanvasText;
  }
  main {
    max-width: 34rem;
    margin: 0 auto;
  }
  h1 {
    font-size: 1.375rem;
    margin: 0 0 1rem;
  }
  p { margin: 0 0 1rem; }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin: 1.5rem 0;
  }
  button {
    font: inherit;
    min-height: 44px;
    padding: 0.625rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid ButtonBorder;
    background: ButtonFace;
    color: ButtonText;
    cursor: pointer;
  }
  button:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  button:focus-visible {
    outline: 3px solid Highlight;
    outline-offset: 2px;
  }
  #status-region {
    padding: 0.75rem;
    border-radius: 0.5rem;
    background: color-mix(in srgb, CanvasText 8%, transparent);
    margin: 0 0 1rem;
  }
  .diagnostics dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.25rem 0.75rem;
    font-size: 0.875rem;
  }
  .diagnostics dt { font-weight: 600; }
  .diagnostics dd { margin: 0; word-break: break-word; }
</style>
</head>
<body>
<main>
  <h1 id="recovery-heading">Update recovery needed</h1>
  <p>${escapeHtml(buildProblemExplanation(diagnostics))}</p>
  <p class="safety-notice">This recovery process never deletes, migrates, or rolls back any of
    your Mioframe documents, settings, or other application data — it only affects stored
    update information and cached release files.</p>
  <div id="status-region" role="status" aria-live="polite">Ready.</div>
  <section class="actions">
    <button type="button" id="retry-button">Retry</button>
    <button type="button" id="install-latest-button">Install latest version</button>
    <button type="button" id="copy-diagnostics-button">Copy diagnostic details</button>
  </section>
  <section class="diagnostics" aria-label="Diagnostic details">
    <dl>
      <dt>Problem</dt><dd>${escapeHtml(diagnostics.problemCode)}</dd>
      <dt>Detail</dt><dd id="diagnostic-detail">${escapeHtml(problemDetail)}</dd>
      <dt>Channel</dt><dd>${escapeHtml(diagnostics.channel)}</dd>
      <dt>Controller database</dt><dd>${escapeHtml(diagnostics.controllerDatabaseName)}</dd>
      <dt>Selected release</dt><dd>${escapeHtml(selectedReleaseNumber)}</dd>
      <dt>Browser error</dt><dd>${escapeHtml(errorName)}</dd>
      <dt>Recovery action</dt><dd id="diagnostic-recovery-action">none</dd>
      <dt>Timestamp</dt><dd>${escapeHtml(diagnostics.timestamp)}</dd>
    </dl>
  </section>
</main>
<script type="application/json" id="diagnostics-data">${diagnosticsJson}</script>
<script>
(function () {
  "use strict";
  var PROTOCOL_VERSION = ${APP_UPDATE_PROTOCOL_VERSION};
  var RECOVER_TYPE = ${JSON.stringify(APP_UPDATE_PROTOCOL_MESSAGE_TYPES.RECOVER_INSTALL_LATEST)};
  var TIMEOUT_MS = ${RECOVERY_COMMAND_TIMEOUT_MS};
  var RESULT_MESSAGES = ${JSON.stringify(RESULT_MESSAGES)};
  var DIAGNOSTICS = JSON.parse(document.getElementById("diagnostics-data").textContent);

  var statusRegion = document.getElementById("status-region");
  var retryButton = document.getElementById("retry-button");
  var installButton = document.getElementById("install-latest-button");
  var copyButton = document.getElementById("copy-diagnostics-button");
  var recoveryActionCell = document.getElementById("diagnostic-recovery-action");
  var currentRecoveryAction = "none";

  function setStatus(text) {
    statusRegion.textContent = text;
  }

  function setRecoveryAction(action) {
    currentRecoveryAction = action;
    recoveryActionCell.textContent = action;
  }

  function setBusy(busy) {
    installButton.disabled = busy;
    retryButton.disabled = busy;
  }

  retryButton.addEventListener("click", function () {
    location.reload();
  });

  function buildDiagnosticsText() {
    return [
      "Problem code: " + DIAGNOSTICS.problemCode,
      "Problem detail: " + (DIAGNOSTICS.problemDetail || "none"),
      "Managed channel: " + DIAGNOSTICS.channel,
      "Controller database: " + DIAGNOSTICS.controllerDatabaseName,
      "Selected release number: " +
        (DIAGNOSTICS.selectedReleaseNumber === undefined || DIAGNOSTICS.selectedReleaseNumber === null
          ? "unknown"
          : DIAGNOSTICS.selectedReleaseNumber),
      "Browser error name: " + (DIAGNOSTICS.errorName || "none"),
      "Recovery action: " + currentRecoveryAction,
      "Timestamp: " + DIAGNOSTICS.timestamp
    ].join("\\n");
  }

  copyButton.addEventListener("click", function () {
    var text = buildDiagnosticsText();
    function fallbackCopy() {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setStatus("Diagnostic details copied.");
      } catch (error) {
        setStatus("Could not copy diagnostic details.");
      }
      document.body.removeChild(textarea);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          setStatus("Diagnostic details copied.");
        },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  installButton.addEventListener("click", function () {
    if (!("serviceWorker" in navigator) || !navigator.serviceWorker.controller) {
      setStatus("No active update controller is available right now. You may retry.");
      return;
    }

    var settled = false;
    var channel = new MessageChannel();

    var timeoutId = setTimeout(function () {
      if (settled) return;
      settled = true;
      setBusy(false);
      setRecoveryAction("timed-out");
      setStatus(
        "The request timed out after " + Math.round(TIMEOUT_MS / 1000) +
        " seconds. Work may still be finishing in the background \\u2014 you may retry."
      );
    }, TIMEOUT_MS);

    channel.port1.onmessage = function (event) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      var data = event.data || {};
      if (data.protocolVersion !== PROTOCOL_VERSION || typeof data.result !== "string") {
        setBusy(false);
        setRecoveryAction("error");
        setStatus("Received an unexpected response. You may retry.");
        return;
      }
      setRecoveryAction(data.result);
      if (data.result === "success" || data.result === "state-changed") {
        setStatus(RESULT_MESSAGES[data.result] || "Reloading\\u2026");
        location.reload();
        return;
      }
      setBusy(false);
      setStatus(RESULT_MESSAGES[data.result] || "Recovery did not succeed. You may retry.");
    };

    setBusy(true);
    setRecoveryAction("installing");
    setStatus("Installing latest version\\u2026");
    navigator.serviceWorker.controller.postMessage(
      { protocolVersion: PROTOCOL_VERSION, type: RECOVER_TYPE },
      [channel.port2]
    );
  });
})();
</script>
</body>
</html>
`;
}

/**
 * Builds the complete `503` recovery HTTP response: the self-contained HTML
 * document from {@link buildRecoveryPageHtml}, `Content-Type: text/html`,
 * and `Cache-Control: no-store` so a browser or intermediary never serves a
 * stale recovery page instead of re-attempting the owned request.
 * @param diagnostics - The complete safe diagnostic model for this render.
 * @returns The recovery page response.
 */
export function buildRecoveryPageResponse(diagnostics: RecoveryDiagnostics): Response {
  return new Response(buildRecoveryPageHtml(diagnostics), {
    status: 503,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
