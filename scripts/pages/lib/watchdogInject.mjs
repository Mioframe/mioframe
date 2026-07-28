/**
 * Builds and injects the boot watchdog: a small, self-contained inline
 * script the publisher writes into every archived release's `index.html`,
 * before the main module entry, so it can detect an early fatal boot
 * failure even if the main application bundle itself is the failing
 * component.
 *
 * The watchdog never implements release selection or storage rules itself:
 * it only relays `BOOT_OK`/`BOOT_FAILED` to the controller worker, asks the
 * worker (via `GET_ACTIVATION_STATUS`) whether this exact release is
 * currently the activation target and, if so, for exactly how long it has
 * left before the worker's own boot-confirmation deadline, and reloads only
 * once it receives the worker's confirmed `APP_UPDATE_ROLLBACK` broadcast.
 *
 * The private protocol message type strings below (`BOOT_OK`, `BOOT_FAILED`,
 * `GET_ACTIVATION_STATUS`, `APP_UPDATE_ROLLBACK`) must stay in sync with
 * `src/shared/service/appUpdate/protocol.ts`. This script runs as a Node
 * publisher tool with no TypeScript loader, so it cannot import that module
 * directly (see `releaseDescriptor.mjs`'s doc comment for the same
 * constraint).
 */

const MAIN_MODULE_SCRIPT_MARKER = '<script type="module"';

/**
 * Builds the watchdog's self-contained inline script source for one
 * release.
 * @param releaseId The exact archived release id this watchdog belongs to.
 * @returns The watchdog's JavaScript source (without `<script>` tags).
 */
export function buildWatchdogScript(releaseId) {
  const releaseIdLiteral = JSON.stringify(releaseId);

  return `(function () {
  var RELEASE_ID = ${releaseIdLiteral};
  var BOOT_OK = 'BOOT_OK';
  var BOOT_FAILED = 'BOOT_FAILED';
  var GET_ACTIVATION_STATUS = 'GET_ACTIVATION_STATUS';
  var ROLLBACK = 'APP_UPDATE_ROLLBACK';

  var settled = false;
  var deadlineTimer = null;

  function postToController(message) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage(message);
    }
  }

  function reportBootFailed() {
    if (settled) return;
    settled = true;
    if (deadlineTimer !== null) clearTimeout(deadlineTimer);
    postToController({ type: BOOT_FAILED, releaseId: RELEASE_ID });
  }

  function onEarlyFatalError() {
    reportBootFailed();
  }

  window.addEventListener('error', onEarlyFatalError);
  window.addEventListener('unhandledrejection', onEarlyFatalError);

  window.mioframeAppUpdateBootOk = function () {
    if (settled) return;
    settled = true;
    if (deadlineTimer !== null) clearTimeout(deadlineTimer);
    window.removeEventListener('error', onEarlyFatalError);
    window.removeEventListener('unhandledrejection', onEarlyFatalError);
    postToController({ type: BOOT_OK, releaseId: RELEASE_ID });
  };

  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready.then(function () {
      if (settled || !navigator.serviceWorker.controller) return;
      var channel = new MessageChannel();
      channel.port1.onmessage = function (event) {
        var data = event.data;
        if (!data || !data.isActivationTarget || !data.deadlineAt) return;
        var msRemaining = new Date(data.deadlineAt).getTime() - Date.now();
        if (msRemaining <= 0) {
          reportBootFailed();
          return;
        }
        deadlineTimer = setTimeout(reportBootFailed, msRemaining);
      };
      navigator.serviceWorker.controller.postMessage(
        { type: GET_ACTIVATION_STATUS, releaseId: RELEASE_ID },
        [channel.port2],
      );
    });

    navigator.serviceWorker.addEventListener('message', function (event) {
      var data = event.data;
      if (data && data.type === ROLLBACK && data.releaseId === RELEASE_ID) {
        location.reload();
      }
    });
  }
})();`;
}

/**
 * Injects the watchdog script into an archived `index.html` document, right
 * before the main module entry script tag.
 * @param html The archived release's built `index.html` content.
 * @param releaseId The exact archived release id this watchdog belongs to.
 * @returns The `index.html` content with the watchdog script injected.
 * @throws {Error} When the main module entry script tag cannot be found.
 */
export function injectWatchdogScript(html, releaseId) {
  const insertAt = html.indexOf(MAIN_MODULE_SCRIPT_MARKER);
  if (insertAt === -1) {
    throw new Error(
      'Could not find the main module script entry to inject the boot watchdog before',
    );
  }
  const watchdogTag = `<script>${buildWatchdogScript(releaseId)}</script>`;
  return html.slice(0, insertAt) + watchdogTag + html.slice(insertAt);
}
