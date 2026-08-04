/**
 * Builds and injects the boot watchdog: a small, self-contained inline
 * script the publisher writes into every archived release's `index.html`,
 * before the main module entry, so it can detect an early fatal boot
 * failure even if the main application bundle itself is the failing
 * component.
 *
 * The watchdog never implements release selection or storage rules itself:
 * it only relays `BOOT_OK`/`BOOT_FAILED` to the controller worker over an
 * acknowledged `MessageChannel` request, asks the worker (via
 * `GET_ACTIVATION_STATUS`) whether this exact release is currently the
 * activation target and, if so, for exactly how long it has left before the
 * worker's own boot-confirmation deadline, and reloads only once it
 * receives the worker's confirmed `APP_UPDATE_ROLLBACK` broadcast. It never
 * disables its own error handlers or deadline timer on a bare "message
 * sent" — only on a worker-confirmed `committed` (`BOOT_OK`) acknowledgement,
 * matching `stateTransitions.ts`/`workerMessages.ts`'s durable commit and
 * rollback semantics.
 *
 * The private protocol message type strings, protocol version, and ack
 * timeout below must stay in sync with
 * `src/shared/service/appUpdate/protocol.ts` and `bootConfirmation.ts`'s
 * `BOOT_ACK_TIMEOUT_MS`. This script runs as a Node publisher tool with no
 * TypeScript loader, so it cannot import those modules directly (see
 * `releaseDescriptor.mjs`'s doc comment for the same constraint);
 * `watchdogProtocolParity.test.ts` proves the literal copies below stay in
 * exact agreement.
 *
 * Every message the watchdog sends carries `protocolVersion: 1`. Every
 * message it consumes (an acknowledgement, the activation-status response,
 * or the rollback broadcast) is checked for that exact field before any of
 * its other fields are read; a missing, mismatched, or otherwise malformed
 * message is ignored — never thrown — exactly like "no response at all"
 * (timeout, or no controller).
 */

const MAIN_MODULE_SCRIPT_MARKER = '<script type="module"';

/** Must match `src/shared/service/appUpdate/bootConfirmation.ts`'s `BOOT_ACK_TIMEOUT_MS`. */
export const WATCHDOG_ACK_TIMEOUT_MS = 5_000;

/** Must match `src/shared/service/appUpdate/protocol.ts`'s `APP_UPDATE_PROTOCOL_VERSION`. */
export const WATCHDOG_PROTOCOL_VERSION = 1;

/**
 * Builds the watchdog's self-contained inline script source for one
 * release.
 * @param releaseNumber The exact archived release number this watchdog belongs to.
 * @returns The watchdog's JavaScript source (without `<script>` tags).
 */
export function buildWatchdogScript(releaseNumber) {
  const releaseNumberLiteral = JSON.stringify(releaseNumber);

  return `(function () {
  var RELEASE_NUMBER = ${releaseNumberLiteral};
  var PROTOCOL_VERSION = ${WATCHDOG_PROTOCOL_VERSION};
  var BOOT_OK = 'BOOT_OK';
  var BOOT_FAILED = 'BOOT_FAILED';
  var GET_ACTIVATION_STATUS = 'GET_ACTIVATION_STATUS';
  var ROLLBACK = 'APP_UPDATE_ROLLBACK';
  var ACK_TIMEOUT_MS = ${WATCHDOG_ACK_TIMEOUT_MS};
  var ACK_COMMITTED = 'committed';
  var ACK_ROLLED_BACK = 'rolled-back';
  var ACK_IGNORED = 'ignored';
  var ACK_ERROR = 'error';

  var settled = false;
  var bootOkReported = false;
  var bootFailedReported = false;
  var deadlineTimer = null;

  // Bounded, never-rejecting controller-message transport, shared by every
  // outgoing message (BOOT_OK, BOOT_FAILED, GET_ACTIVATION_STATUS). Every
  // failure mode -- no controller, a throwing controller getter, a throwing
  // MessageChannel constructor, or a synchronously throwing postMessage --
  // resolves null exactly like "no response" (an unacknowledged send or a
  // timeout), so a transport failure can never turn into an unhandled
  // promise rejection or permanently latch a caller's own report flag.
  function sendToController(message) {
    return new Promise(function (resolve) {
      var settledLocal = false;
      var timer = null;
      var channel = null;

      function settle(value) {
        if (settledLocal) return;
        settledLocal = true;
        if (timer !== null) clearTimeout(timer);
        if (channel) {
          try {
            channel.port1.onmessage = null;
            channel.port1.close();
          } catch (closeError) {
            // Port cleanup must never throw out of this boundary.
          }
        }
        resolve(value);
      }

      var controller;
      try {
        controller = navigator.serviceWorker && navigator.serviceWorker.controller;
      } catch (controllerError) {
        resolve(null);
        return;
      }
      if (!controller) {
        resolve(null);
        return;
      }

      try {
        channel = new MessageChannel();
      } catch (channelError) {
        resolve(null);
        return;
      }

      channel.port1.onmessage = function (event) {
        settle((event && event.data) || null);
      };
      timer = setTimeout(function () {
        settle(null);
      }, ACK_TIMEOUT_MS);

      try {
        controller.postMessage(message, [channel.port2]);
      } catch (postError) {
        settle(null);
      }
    });
  }

  function showRecoveryMessage() {
    var el = document.createElement('div');
    el.setAttribute('role', 'alert');
    el.style.cssText =
      'position:fixed;bottom:0;left:0;right:0;padding:12px 16px;' +
      'background:#3a1212;color:#fff;font:14px/1.4 system-ui,sans-serif;' +
      'z-index:2147483647;text-align:center;';
    el.textContent =
      'This update could not finish safely. Please close and reopen Mioframe to continue.';
    (document.body || document.documentElement).appendChild(el);
  }

  function reportBootFailed() {
    if (settled || bootFailedReported) return;
    bootFailedReported = true;
    sendToController({
      protocolVersion: PROTOCOL_VERSION,
      type: BOOT_FAILED,
      releaseNumber: RELEASE_NUMBER,
    }).then(function (response) {
      var ack = response && response.protocolVersion === PROTOCOL_VERSION ? response.ack : null;
      if (ack === ACK_ERROR) {
        settled = true;
        if (deadlineTimer !== null) clearTimeout(deadlineTimer);
        showRecoveryMessage();
        return;
      }
      if (ack === ACK_ROLLED_BACK) {
        // The matching APP_UPDATE_ROLLBACK broadcast below performs the
        // actual reload once it arrives; nothing else to do here.
        return;
      }
      if (ack === ACK_IGNORED || ack === null) {
        // No durable outcome recorded (an explicit ignore, a timeout, or no
        // controller): allow a later genuine failure to be reported again
        // instead of latching forever.
        bootFailedReported = false;
        return;
      }
      // Any other unexpected acknowledgement value: fail closed the same
      // way, so a malformed report can never latch this session out of ever
      // reporting a failure again.
      bootFailedReported = false;
    });
  }

  function onEarlyFatalError() {
    reportBootFailed();
  }

  window.addEventListener('error', onEarlyFatalError);
  window.addEventListener('unhandledrejection', onEarlyFatalError);

  window.mioframeAppUpdateBootOk = function () {
    if (settled || bootOkReported) return;
    bootOkReported = true;
    var request = {
      protocolVersion: PROTOCOL_VERSION,
      type: BOOT_OK,
      releaseNumber: RELEASE_NUMBER,
    };
    sendToController(request).then(function (response) {
      var isCommitted =
        response && response.protocolVersion === PROTOCOL_VERSION && response.ack === ACK_COMMITTED;
      if (isCommitted) {
        settled = true;
        if (deadlineTimer !== null) clearTimeout(deadlineTimer);
        window.removeEventListener('error', onEarlyFatalError);
        window.removeEventListener('unhandledrejection', onEarlyFatalError);
        return;
      }
      // Not committed ('ignored', 'error', or no acknowledgement at all):
      // the worker did not confirm a durable commit, so the watchdog stays
      // armed rather than claiming success.
      bootOkReported = false;
    });
  };

  // Parses one GET_ACTIVATION_STATUS response, accepting only the exact
  // two v1 shapes: { protocolVersion, isActivationTarget: false } or
  // { protocolVersion, isActivationTarget: true, deadlineAt: <valid ISO
  // string> }. Any other shape (missing/mismatched protocolVersion, a
  // truthy non-boolean isActivationTarget, a missing/non-string/unparsable
  // deadlineAt) returns null so the caller can ignore it completely, never
  // disarming, arming a timer, or reporting a boot failure from malformed
  // data. Returns the deadline as a parsed number so the caller never
  // re-parses the same string twice.
  function parseActivationStatusResponse(data) {
    if (!data || data.protocolVersion !== PROTOCOL_VERSION) return null;
    if (data.isActivationTarget === false) return { isActivationTarget: false };
    if (data.isActivationTarget !== true) return null;
    if (typeof data.deadlineAt !== 'string') return null;
    var deadlineAtMs = Date.parse(data.deadlineAt);
    if (!isFinite(deadlineAtMs)) return null;
    return { isActivationTarget: true, deadlineAtMs: deadlineAtMs };
  }

  if (navigator.serviceWorker) {
    navigator.serviceWorker.ready
      .then(function () {
        if (settled) return;
        return sendToController({
          protocolVersion: PROTOCOL_VERSION,
          type: GET_ACTIVATION_STATUS,
          releaseNumber: RELEASE_NUMBER,
        }).then(function (data) {
          var parsed = parseActivationStatusResponse(data);
          if (!parsed) return;
          if (!parsed.isActivationTarget) {
            // Not this session's activation target: permanently disarm rather
            // than merely skip arming the deadline timer, so an ordinary
            // runtime error later in this session can never send a spurious
            // BOOT_FAILED for a release that was never being activated.
            settled = true;
            if (deadlineTimer !== null) clearTimeout(deadlineTimer);
            window.removeEventListener('error', onEarlyFatalError);
            window.removeEventListener('unhandledrejection', onEarlyFatalError);
            return;
          }
          var msRemaining = parsed.deadlineAtMs - Date.now();
          if (msRemaining <= 0) {
            reportBootFailed();
            return;
          }
          deadlineTimer = setTimeout(reportBootFailed, msRemaining);
        });
      })
      .catch(function (readyError) {
        // navigator.serviceWorker.ready rejecting must never surface as an
        // unhandled rejection; it simply means activation status can never
        // be learned for this session, so the watchdog stays armed for
        // window.mioframeAppUpdateBootOk / an early fatal error as-is.
      });

    navigator.serviceWorker.addEventListener('message', function (event) {
      var data = event.data;
      if (
        data &&
        data.protocolVersion === PROTOCOL_VERSION &&
        data.type === ROLLBACK &&
        data.releaseNumber === RELEASE_NUMBER
      ) {
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
 * @param releaseNumber The exact archived release number this watchdog belongs to.
 * @returns The `index.html` content with the watchdog script injected.
 * @throws {Error} When the main module entry script tag cannot be found.
 */
export function injectWatchdogScript(html, releaseNumber) {
  const insertAt = html.indexOf(MAIN_MODULE_SCRIPT_MARKER);
  if (insertAt === -1) {
    throw new Error(
      'Could not find the main module script entry to inject the boot watchdog before',
    );
  }
  const watchdogTag = `<script>${buildWatchdogScript(releaseNumber)}</script>`;
  return html.slice(0, insertAt) + watchdogTag + html.slice(insertAt);
}
