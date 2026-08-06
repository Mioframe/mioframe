import {
  APP_UPDATE_PROTOCOL_MESSAGE_TYPES,
  APP_UPDATE_PROTOCOL_VERSION,
  RECOVER_INSTALL_LATEST_RESULT_CODES,
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

/**
 * Problem codes where the persisted record has already been read and
 * confirmed absent or corrupt — genuine, already-known state loss, distinct
 * from `UPDATE_STORAGE_UNAVAILABLE`'s merely-transient read failure (see
 * {@link buildProblemExplanation}).
 */
const CONFIRMED_STATE_LOSS_PROBLEM_CODES = new Set(['UPDATE_STATE_ABSENT', 'UPDATE_STATE_INVALID']);

/**
 * Reads `problemDetail` from a {@link RecoveryDiagnostics}, narrowed by its
 * `problemCode` discriminant: `undefined` for the two variants
 * (`UPDATE_STATE_ABSENT`, `UPDATE_STORAGE_UNAVAILABLE`) that carry no
 * `problemDetail` field at all.
 * @param diagnostics - The diagnostic model to render.
 * @returns The stable `problemDetail`, or `undefined`.
 */
function getProblemDetail(diagnostics: RecoveryDiagnostics): string | undefined {
  return diagnostics.problemCode === 'UPDATE_STATE_INVALID' ||
    diagnostics.problemCode === 'ACTIVE_RELEASE_UNAVAILABLE'
    ? diagnostics.problemDetail
    : undefined;
}

/**
 * Reads `selectedReleaseNumber` from a {@link RecoveryDiagnostics}, narrowed
 * by its `problemCode` discriminant: only `ACTIVE_RELEASE_UNAVAILABLE`
 * carries this field.
 * @param diagnostics - The diagnostic model to render.
 * @returns The selected release number, or `undefined`.
 */
function getSelectedReleaseNumber(diagnostics: RecoveryDiagnostics): number | undefined {
  return diagnostics.problemCode === 'ACTIVE_RELEASE_UNAVAILABLE'
    ? diagnostics.selectedReleaseNumber
    : undefined;
}

/**
 * Reads `errorName` from a {@link RecoveryDiagnostics}, narrowed by its
 * `problemCode` discriminant: only `UPDATE_STORAGE_UNAVAILABLE` carries this
 * field.
 * @param diagnostics - The diagnostic model to render.
 * @returns The allowlisted storage error name, or `undefined`.
 */
function getErrorName(diagnostics: RecoveryDiagnostics): string | undefined {
  return diagnostics.problemCode === 'UPDATE_STORAGE_UNAVAILABLE'
    ? diagnostics.errorName
    : undefined;
}

/**
 * Builds the scenario-specific explanatory copy shown above the recovery
 * actions.
 *
 * The confirmed-state-loss group (absent or invalid persisted record — the
 * record was actually read and found genuinely unusable) warns that no
 * previous version or update mode can be trusted. `UPDATE_STORAGE_UNAVAILABLE`
 * is deliberately distinct: the persisted record itself was never read, so
 * this may only be a transient storage failure — the copy never promises a
 * guaranteed baseline reset, only that the worker will re-check storage and
 * pick whichever recovery path fresh state actually calls for.
 * `ACTIVE_RELEASE_UNAVAILABLE` explains that the previously selected release
 * merely could not be restored and describes each action's actual effect.
 * @param diagnostics - The current recovery diagnostic model.
 * @returns HTML-safe explanatory paragraph text (no wrapping tag).
 */
function buildProblemExplanation(diagnostics: RecoveryDiagnostics): string {
  if (CONFIRMED_STATE_LOSS_PROBLEM_CODES.has(diagnostics.problemCode)) {
    return (
      'This channel’s update information could not be read, so the previously selected ' +
      'version and update mode cannot be trusted. Installing the latest version resets update ' +
      'mode to Automatic and starts a brand-new baseline release — there is no older trusted ' +
      'version to fall back to. If this new baseline cannot start, a corrected newer release ' +
      'remains discoverable automatically the next time this app is opened.'
    );
  }
  if (diagnostics.problemCode === 'UPDATE_STORAGE_UNAVAILABLE') {
    return (
      'This channel’s update information could not be read right now — this may only be ' +
      'temporary. Installing the latest version asks the update worker to re-check update ' +
      'storage and choose the safe recovery path for whatever it finds there: if storage is ' +
      'still unreadable or the record is genuinely lost, it starts a brand-new Automatic ' +
      'baseline release with no older trusted version to fall back to; if your previous ' +
      'selection can still be read after all, it is respected instead.'
    );
  }
  return (
    'Your previously selected release could not be restored from its local copy. Retry attempts ' +
    'to restore it again. Installing the latest version does not switch to it immediately — it ' +
    'is scheduled to activate the next time this app can safely restart, and your current ' +
    'release selection is unchanged until then.'
  );
}

/**
 * Human-readable, non-technical text for every {@link RecoverInstallLatestResultCode},
 * shown in the status region after a command completes.
 *
 * `success` is deliberately worded to stay true for every successful
 * recovery outcome — a fresh Automatic baseline, an exact restoration of the
 * already-selected release, or a newer release staged as a `ready`
 * candidate for the ordinary clean-launch/`BOOT_OK` flow — since the
 * protocol's single `success` code never reveals which one occurred; the
 * page's own reload is what lets the user observe the resulting state.
 */
const RESULT_MESSAGES: Record<RecoverInstallLatestResultCode, string> = {
  success: 'Update recovery finished successfully. Reloading…',
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
  const problemDetail = getProblemDetail(diagnostics) ?? 'none';
  const selectedReleaseNumberValue = getSelectedReleaseNumber(diagnostics);
  const selectedReleaseNumber =
    selectedReleaseNumberValue === undefined ? 'unknown' : String(selectedReleaseNumberValue);
  const errorName = getErrorName(diagnostics) ?? 'none';
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
  var RESULT_CODES = ${JSON.stringify(RECOVER_INSTALL_LATEST_RESULT_CODES)};
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

    // Every click owns exactly one fresh MessageChannel and one fresh
    // "settled" flag, closed over by this attempt alone: a retry after
    // timeout or failure always starts a brand-new attempt here, never
    // reuses or references this one's channel or state.
    var settled = false;
    var channel = new MessageChannel();

    function closeOwnedPorts() {
      // Closing an already-transferred (or never-transferred, on a
      // synchronous postMessage failure) port is always safe: a closed or
      // neutered port simply stops delivering.
      try {
        channel.port1.close();
      } catch (error) {
        // Ignored: closing must never itself block settlement.
      }
      try {
        channel.port2.close();
      } catch (error) {
        // Ignored: closing must never itself block settlement.
      }
    }

    var timeoutId = setTimeout(function () {
      if (settled) return;
      settled = true;
      closeOwnedPorts();
      setBusy(false);
      setRecoveryAction("timed-out");
      setStatus(
        "The request timed out after " + Math.round(TIMEOUT_MS / 1000) +
        " seconds. Work may still be finishing in the background \\u2014 you may retry."
      );
      // Deliberately never cancels the worker's own in-progress recovery
      // attempt: this only clears this page's own local busy state.
    }, TIMEOUT_MS);

    channel.port1.onmessage = function (event) {
      // A response can arrive after this attempt already settled (timeout,
      // or a synchronous postMessage failure) if the worker still delivers
      // late — it must never mutate an already-settled attempt.
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      closeOwnedPorts();
      var data = (event && event.data) || {};
      if (
        data.protocolVersion !== PROTOCOL_VERSION ||
        typeof data.result !== "string" ||
        RESULT_CODES.indexOf(data.result) === -1
      ) {
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
    try {
      navigator.serviceWorker.controller.postMessage(
        { protocolVersion: PROTOCOL_VERSION, type: RECOVER_TYPE },
        [channel.port2]
      );
    } catch (error) {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      closeOwnedPorts();
      setBusy(false);
      setRecoveryAction("error");
      setStatus("Could not send the recovery request. You may retry.");
    }
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
