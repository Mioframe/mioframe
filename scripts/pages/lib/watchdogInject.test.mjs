import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WATCHDOG_ACK_TIMEOUT_MS } from '../../../src/shared/service/appUpdate/workerProtocolWireContract.ts';
import { buildWatchdogScript, injectWatchdogScript } from './watchdogInject.mjs';

/**
 * Waits one macrotask turn: `MessageChannel`/`MessagePort` delivery is
 * asynchronous beyond plain microtasks in this test environment, so a bare
 * `await Promise.resolve()` chain is not enough to observe a port's
 * `onmessage` firing.
 * @returns A promise that resolves after one macrotask turn.
 */
function flushTasks() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// A watchdog instance that never disarms (e.g. an ignored malformed
// response) permanently attaches its own `error`/`unhandledrejection`
// listener to the real `window`, which is never stubbed. Left alone, that
// listener would still be live in a later test and fire on that later
// test's own `window.dispatchEvent`, contaminating its assertions. Every
// test in this file gets a completely fresh `window` listener slate.
let addedWindowListeners = [];
const realAddEventListener = window.addEventListener.bind(window);
const realRemoveEventListener = window.removeEventListener.bind(window);

beforeEach(() => {
  addedWindowListeners = [];
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'error' || type === 'unhandledrejection') {
      addedWindowListeners.push([type, listener, options]);
    }
    return realAddEventListener(type, listener, options);
  });
});

afterEach(() => {
  // `removeEventListener`'s capture option must match the option a listener
  // was added with, or the real DOM/happy-dom implementation silently
  // refuses to remove it — this must mirror the watchdog's own paired
  // add/remove options exactly, not merely the event type and callback.
  for (const [type, listener, options] of addedWindowListeners) {
    realRemoveEventListener(type, listener, options);
  }
  vi.restoreAllMocks();
});

/**
 * Executes a built watchdog script against a stubbed `navigator.serviceWorker`
 * that answers `GET_ACTIVATION_STATUS` with `response`, then returns every
 * message the stubbed controller received via `postMessage` so a test can
 * assert on real runtime behavior rather than only the script's source text.
 * @param releaseNumber - The release number to build the watchdog script for.
 * @param response - The `GET_ACTIVATION_STATUS` response to simulate.
 * @returns The list of messages sent to the controller, live-updated as the script runs.
 */
async function runWatchdogWithActivationStatusResponse(releaseNumber, response) {
  const postMessageCalls = [];
  const controller = {
    postMessage: (message, transfer) => {
      postMessageCalls.push(message);
      if (message.type === 'GET_ACTIVATION_STATUS') {
        transfer[0].postMessage(response);
      }
    },
  };
  const addEventListener = vi.fn();
  vi.stubGlobal('navigator', {
    serviceWorker: {
      ready: Promise.resolve(),
      controller,
      addEventListener,
    },
  });

  // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
  new Function(buildWatchdogScript(releaseNumber))();

  // Flushes the `ready.then(...)` microtask, then the MessageChannel round trip.
  await Promise.resolve();
  await flushTasks();
  await flushTasks();

  return postMessageCalls;
}

describe('buildWatchdogScript', () => {
  it('embeds the exact release number as a JSON literal', () => {
    const script = buildWatchdogScript(123);
    expect(script).toContain('var RELEASE_NUMBER = 123;');
  });

  it('references every required private protocol message type', () => {
    const script = buildWatchdogScript(1);
    expect(script).toContain("'BOOT_OK'");
    expect(script).toContain("'BOOT_FAILED'");
    expect(script).toContain("'GET_ACTIVATION_STATUS'");
    expect(script).toContain("'APP_UPDATE_ROLLBACK'");
  });

  it('exposes exactly one narrow function for the app to report successful boot', () => {
    const script = buildWatchdogScript(1);
    expect(script).toContain('window.mioframeAppUpdateBootOk = function');
  });

  it('installs early error and unhandledrejection listeners', () => {
    const script = buildWatchdogScript(1);
    expect(script).toContain("window.addEventListener('error', onEarlyFatalError, true)");
    expect(script).toContain("window.addEventListener('unhandledrejection', onEarlyFatalError)");
  });

  it('registers the error listener with capture so non-bubbling linked-resource load failures are observed', () => {
    const script = buildWatchdogScript(1);
    expect(script).toContain("window.addEventListener('error', onEarlyFatalError, true)");
  });

  it('removes the error listener using exactly the same capture option it was registered with', () => {
    const script = buildWatchdogScript(1);
    const removalCount =
      script.split("window.removeEventListener('error', onEarlyFatalError, true)").length - 1;
    // Once on a committed BOOT_OK, once on a rolled-back BOOT_OK. A
    // non-activation-target GET_ACTIVATION_STATUS response no longer
    // disarms, so it no longer contributes a removal site.
    expect(removalCount).toBe(2);
  });

  it('sends BOOT_OK and BOOT_FAILED through an acknowledged MessageChannel request, not a bare postMessage', () => {
    const script = buildWatchdogScript(1);
    expect(script).toContain('function sendToController(message)');
    expect(script).toContain('new MessageChannel()');
    expect(script).toContain('type: BOOT_OK,');
    expect(script).toContain('releaseNumber: RELEASE_NUMBER,');
    expect(script).toContain('type: BOOT_FAILED,');
  });

  it('stamps every outgoing message with the current protocol version', () => {
    const script = buildWatchdogScript(1);
    const occurrences = script.split('protocolVersion: PROTOCOL_VERSION').length - 1;
    // BOOT_OK, BOOT_FAILED, and GET_ACTIVATION_STATUS each send it.
    expect(occurrences).toBe(3);
  });

  it('only disarms on a BOOT_OK response acknowledging a committed outcome', () => {
    const script = buildWatchdogScript(1);
    const bootOkBody = script.slice(
      script.indexOf('window.mioframeAppUpdateBootOk = function'),
      script.indexOf('if (navigator.serviceWorker) {'),
    );
    expect(bootOkBody).toContain('response.ack === ACK_COMMITTED');
    // Disarming (clearing the deadline timer and removing the early-error
    // listeners) must be conditioned on that check, not unconditional.
    expect(bootOkBody.indexOf('response.ack === ACK_COMMITTED')).toBeLessThan(
      bootOkBody.indexOf('clearTimeout(deadlineTimer)'),
    );
  });

  it('shows a recovery message and never reloads when rollback persistence itself fails', () => {
    const script = buildWatchdogScript(1);
    const reportBootFailedBody = script.slice(
      script.indexOf('function reportBootFailed'),
      script.indexOf('function onEarlyFatalError'),
    );
    expect(reportBootFailedBody).toContain('ack === ACK_ERROR');
    expect(reportBootFailedBody).toContain('showRecoveryMessage()');
    expect(reportBootFailedBody).not.toContain('location.reload');
  });

  it('does not settle outside activation: isActivationTarget === false is a no-op, arming no deadline and touching no listener', () => {
    const script = buildWatchdogScript(1);
    const activationStatusBody = script.slice(
      script.indexOf('if (!parsed.isActivationTarget) {'),
      script.indexOf('var msRemaining = parsed.deadlineAtMs'),
    );
    expect(activationStatusBody).not.toContain('settled = true;');
    expect(activationStatusBody).not.toContain('clearTimeout(deadlineTimer)');
    expect(activationStatusBody).not.toContain('removeEventListener');
    expect(activationStatusBody).not.toContain('setTimeout');
  });

  it('checks settled before applying a late GET_ACTIVATION_STATUS result, so it can never mutate an already-settled watchdog', () => {
    const script = buildWatchdogScript(1);
    const responseHandlerBody = script.slice(
      script.indexOf('}).then(function (data) {'),
      script.indexOf('.catch(function (readyError)'),
    );
    const parsedGuardIndex = responseHandlerBody.indexOf('if (!parsed) return;');
    const settledGuardIndex = responseHandlerBody.indexOf('if (settled) return;');
    const branchIndex = responseHandlerBody.indexOf('if (!parsed.isActivationTarget) {');
    expect(parsedGuardIndex).toBeGreaterThan(-1);
    expect(settledGuardIndex).toBeGreaterThan(parsedGuardIndex);
    expect(settledGuardIndex).toBeLessThan(branchIndex);
  });

  it('never calls location.reload directly inside reportBootFailed: every reload goes through the shared scheduleReload guard', () => {
    const script = buildWatchdogScript(1);
    const reportBootFailedBody = script.slice(
      script.indexOf('function reportBootFailed'),
      script.indexOf('function onEarlyFatalError'),
    );
    expect(reportBootFailedBody).not.toContain('location.reload');
    expect(reportBootFailedBody).toContain('scheduleReload()');
    expect(script).toContain('function scheduleReload()');
    // The only literal call site: inside scheduleReload() itself, so a
    // direct rolled-back acknowledgement and a later duplicate broadcast
    // can never independently trigger two reloads.
    expect(script.match(/location\.reload\(\)/g)).toHaveLength(1);
  });
});

describe('watchdog disarm outside activation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /**
   * Runs the watchdog against a controller that always answers
   * `GET_ACTIVATION_STATUS` with `isActivationTarget: false`, and answers
   * `BOOT_OK`/`BOOT_FAILED` with the given acknowledgement (when provided).
   * Returns every message sent to the controller plus a `location.reload`
   * spy, so a test can prove both the acknowledgement path and the reload
   * outcome for a missed-broadcast stale window recovering through a direct
   * acknowledgement rather than through `APP_UPDATE_ROLLBACK`.
   * @param acks - `bootOkAck`/`bootFailedAck`: the acknowledgement to reply with for that message type, if any.
   * @returns The list of messages sent to the controller and the `location.reload` spy.
   */
  function runOutsideActivationWithAck({ bootOkAck, bootFailedAck } = {}) {
    const postMessageCalls = [];
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: false });
        }
        if (message.type === 'BOOT_OK' && bootOkAck) {
          transfer[0].postMessage({ protocolVersion: 1, ack: bootOkAck });
        }
        if (message.type === 'BOOT_FAILED' && bootFailedAck) {
          transfer[0].postMessage({ protocolVersion: 1, ack: bootFailedAck });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    return { postMessageCalls, reload };
  }

  it('ignores an activation-status response with a missing or unsupported protocol version, never disarming', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      isActivationTarget: false,
    });

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('a true activation target remains armed: a later runtime error still reports BOOT_FAILED', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt,
    });

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('active release outside activation: BOOT_OK -> committed settles normally with no reload, and a later error sends no BOOT_FAILED', async () => {
    const { postMessageCalls, reload } = runOutsideActivationWithAck({ bootOkAck: 'committed' });
    await Promise.resolve();
    await flushTasks();
    await flushTasks();
    expect(postMessageCalls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    window.mioframeAppUpdateBootOk();
    await flushTasks();

    expect(postMessageCalls.some((message) => message.type === 'BOOT_OK')).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    const callsBeforeLaterError = postMessageCalls.length;

    // Settled via the committed acknowledgement: the early-error listeners
    // must already be removed, so a later runtime error sends nothing.
    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(postMessageCalls.length).toBe(callsBeforeLaterError);
  });

  it('stale release after a missed broadcast: BOOT_OK -> rolled-back reloads exactly once without any rollback broadcast', async () => {
    const { postMessageCalls, reload } = runOutsideActivationWithAck({
      bootOkAck: 'rolled-back',
    });
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.mioframeAppUpdateBootOk();
    await flushTasks();

    expect(postMessageCalls.some((message) => message.type === 'BOOT_OK')).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('stale release fails before application boot: an early error reports BOOT_FAILED -> rolled-back and reloads exactly once', async () => {
    const { postMessageCalls, reload } = runOutsideActivationWithAck({
      bootFailedAck: 'rolled-back',
    });
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(postMessageCalls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('current active release fails outside activation: BOOT_FAILED -> ignored stays recoverable, and a later BOOT_OK -> committed still settles', async () => {
    const { postMessageCalls, reload } = runOutsideActivationWithAck({
      bootFailedAck: 'ignored',
      bootOkAck: 'committed',
    });
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(postMessageCalls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);
    expect(reload).not.toHaveBeenCalled();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(postMessageCalls.some((message) => message.type === 'BOOT_OK')).toBe(true);
    expect(reload).not.toHaveBeenCalled();
  });
});

describe('late GET_ACTIVATION_STATUS response after settlement', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('cannot mutate a watchdog already settled by BOOT_OK -> committed: no reload, no additional report, no listener re-add', async () => {
    let activationStatusPort;
    const postMessageCalls = [];
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          // Deliberately withheld: delivered manually below, after BOOT_OK
          // has already settled the watchdog, to prove a late response.
          activationStatusPort = transfer[0];
        }
        if (message.type === 'BOOT_OK') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'committed' });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(postMessageCalls.some((message) => message.type === 'BOOT_OK')).toBe(true);
    expect(reload).not.toHaveBeenCalled();
    const callsBeforeLateResponse = postMessageCalls.length;

    activationStatusPort.postMessage({ protocolVersion: 1, isActivationTarget: false });
    await flushTasks();

    expect(postMessageCalls.length).toBe(callsBeforeLateResponse);
    expect(reload).not.toHaveBeenCalled();

    // The committed acknowledgement already removed the early-error
    // listeners; the late status response must not have re-added them or
    // armed a deadline that could later fire.
    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(postMessageCalls.length).toBe(callsBeforeLateResponse);
  });

  it('cannot mutate a watchdog already settled by BOOT_OK -> rolled-back: exactly one reload, no additional report', async () => {
    let activationStatusPort;
    const postMessageCalls = [];
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          activationStatusPort = transfer[0];
        }
        if (message.type === 'BOOT_OK') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'rolled-back' });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(reload).toHaveBeenCalledTimes(1);
    const callsBeforeLateResponse = postMessageCalls.length;

    activationStatusPort.postMessage({
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt: new Date(Date.now() + 60_000).toISOString(),
    });
    await flushTasks();

    // A late true-activation-target response must not arm a deadline timer
    // on top of an already-settled, already-reloading watchdog.
    expect(postMessageCalls.length).toBe(callsBeforeLateResponse);
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('resource-load error observation during activation', () => {
  /**
   * Dispatches a non-bubbling `error` event from a linked-resource-style
   * element attached to the document (as a failed `<script>` or `<link>`
   * load would), so the assertion exercises real capture-phase propagation
   * to `window` rather than a bare `window.dispatchEvent`, whose target is
   * already `window` and would pass regardless of the capture option.
   */
  function dispatchResourceLoadError() {
    const element = document.createElement('script');
    document.body.appendChild(element);
    element.dispatchEvent(new Event('error', { bubbles: false }));
    document.body.removeChild(element);
  }

  it('a true activation target reports BOOT_FAILED from a non-bubbling linked-resource load failure', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt,
    });

    dispatchResourceLoadError();
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('a committed BOOT_OK removes the capture-phase listener: a later resource load failure is ignored', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const postMessageCalls = [];
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: true, deadlineAt });
        }
        if (message.type === 'BOOT_OK') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'committed' });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(postMessageCalls.some((message) => message.type === 'BOOT_OK')).toBe(true);
    const callsBeforeResourceError = postMessageCalls.length;

    dispatchResourceLoadError();
    await flushTasks();

    expect(postMessageCalls.length).toBe(callsBeforeResourceError);

    vi.unstubAllGlobals();
  });

  it('outside activation, a resource load failure is still reported exactly like an ordinary runtime error (the watchdog stays armed)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: false,
    });

    dispatchResourceLoadError();
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });
});

describe('direct rolled-back acknowledgement reload recovery', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reloads immediately on a direct rolled-back acknowledgement to BOOT_FAILED, without waiting for the broadcast', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const controller = {
      postMessage: (message, transfer) => {
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: true, deadlineAt });
        }
        if (message.type === 'BOOT_FAILED') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'rolled-back' });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads immediately on a direct rolled-back acknowledgement to BOOT_OK', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const controller = {
      postMessage: (message, transfer) => {
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: true, deadlineAt });
        }
        if (message.type === 'BOOT_OK') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'rolled-back' });
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.mioframeAppUpdateBootOk();
    await flushTasks();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('does not reload a second time when a later rollback broadcast follows a direct rolled-back acknowledgement', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    let messageListener;
    const controller = {
      postMessage: (message, transfer) => {
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: true, deadlineAt });
        }
        if (message.type === 'BOOT_FAILED') {
          transfer[0].postMessage({ protocolVersion: 1, ack: 'rolled-back' });
        }
      },
    };
    const addEventListener = vi.fn((type, listener) => {
      if (type === 'message') messageListener = listener;
    });
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await Promise.resolve();
    await flushTasks();
    await flushTasks();

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(reload).toHaveBeenCalledTimes(1);

    messageListener({
      data: { protocolVersion: 1, type: 'APP_UPDATE_ROLLBACK', releaseNumber: 1 },
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe('malformed GET_ACTIVATION_STATUS responses fail closed', () => {
  it('an invalid deadlineAt date string is ignored: never arms a timer or reports BOOT_FAILED merely from receiving it', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt: 'not-a-valid-date',
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a missing deadlineAt on a true activation target is ignored', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a numeric deadlineAt is ignored (must be a string)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt: Date.now() - 1000,
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('an object deadlineAt is ignored (must be a string)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt: {},
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a null deadlineAt is ignored (must be a string)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt: null,
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a truthy non-boolean isActivationTarget is ignored, even with an otherwise-valid deadlineAt', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: 1,
      deadlineAt,
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a false variant with unrelated deadline fields still parses as isActivationTarget: false, leaving the watchdog armed (additive v1 fields do not break parsing)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: false,
      deadlineAt: 'not-a-valid-date',
    });

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });

  it('a valid past deadline still triggers the existing boot-failure path immediately', async () => {
    const deadlineAt = new Date(Date.now() - 1000).toISOString();
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: true,
      deadlineAt,
    });

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });
});

describe('watchdog transport resilience', () => {
  /**
   * Tracks Node's `unhandledRejection` events for the duration of one test,
   * so a transport failure that would previously auto-reject the
   * `sendToController` promise (via the Promise constructor's own
   * throw-in-executor -> reject behavior) is caught directly, not merely
   * inferred from absence of a crash.
   * @returns The live-updated list of captured rejection reasons, and a `stop` function that removes the listener.
   */
  function trackUnhandledRejections() {
    const reasons = [];
    const onUnhandledRejection = (reason) => reasons.push(reason);
    process.on('unhandledRejection', onUnhandledRejection);
    return {
      reasons,
      stop: () => process.off('unhandledRejection', onUnhandledRejection),
    };
  }

  function runScript(releaseNumber = 1) {
    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(releaseNumber))();
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('never produces an unhandled rejection when the MessageChannel constructor throws', async () => {
    const controller = { postMessage: vi.fn() };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    vi.stubGlobal('MessageChannel', function throwingMessageChannel() {
      throw new Error('MessageChannel unavailable');
    });
    const tracker = trackUnhandledRejections();

    expect(() => runScript()).not.toThrow();
    await Promise.resolve();
    await flushTasks();

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  it('never produces an unhandled rejection when the controller getter throws', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.resolve(),
        get controller() {
          throw new Error('controller access failed');
        },
        addEventListener: vi.fn(),
      },
    });
    const tracker = trackUnhandledRejections();

    expect(() => runScript()).not.toThrow();
    await Promise.resolve();
    await flushTasks();

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  it('never produces an unhandled rejection when postMessage throws for GET_ACTIVATION_STATUS', async () => {
    const controller = {
      postMessage: () => {
        throw new Error('postMessage failed');
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    const tracker = trackUnhandledRejections();

    runScript();
    await Promise.resolve();
    await flushTasks();

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  it('never produces an unhandled rejection when postMessage throws for BOOT_OK, and resets bootOkReported so a later call retries', async () => {
    const postMessageCalls = [];
    const controller = {
      postMessage: (message) => {
        postMessageCalls.push(message);
        throw new Error('postMessage failed');
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    const tracker = trackUnhandledRejections();

    runScript();
    await Promise.resolve();
    await flushTasks();
    const afterActivationStatus = postMessageCalls.length;

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(postMessageCalls.length).toBeGreaterThan(afterActivationStatus);
    const afterFirstBootOk = postMessageCalls.length;

    // A latched bootOkReported would silently drop this second call.
    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(postMessageCalls.length).toBeGreaterThan(afterFirstBootOk);

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  it('never produces an unhandled rejection when postMessage throws for BOOT_FAILED, and resets bootFailedReported so a later failure reports again', async () => {
    const postMessageCalls = [];
    const controller = {
      postMessage: (message) => {
        postMessageCalls.push(message);
        throw new Error('postMessage failed');
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    const tracker = trackUnhandledRejections();

    runScript();
    await Promise.resolve();
    await flushTasks();
    const afterActivationStatus = postMessageCalls.length;

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(postMessageCalls.length).toBeGreaterThan(afterActivationStatus);
    const afterFirstBootFailed = postMessageCalls.length;

    // A latched bootFailedReported would silently drop this second report.
    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(postMessageCalls.length).toBeGreaterThan(afterFirstBootFailed);

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  it('never produces an unhandled rejection when navigator.serviceWorker.ready rejects', async () => {
    vi.stubGlobal('navigator', {
      serviceWorker: {
        ready: Promise.reject(new Error('ready failed')),
        controller: null,
        addEventListener: vi.fn(),
      },
    });
    const tracker = trackUnhandledRejections();

    expect(() => runScript()).not.toThrow();
    await Promise.resolve();
    await flushTasks();

    expect(tracker.reasons).toEqual([]);
    tracker.stop();
  });

  function stubFakePortMessageChannel() {
    const closedPorts = [];
    function FakePort() {
      this.onmessage = null;
      this.close = () => closedPorts.push(this);
    }
    vi.stubGlobal('MessageChannel', function FakeMessageChannel() {
      this.port1 = new FakePort();
      this.port2 = new FakePort();
    });
    return closedPorts;
  }

  it('closes the receiving port once the transport ack times out', async () => {
    const closedPorts = stubFakePortMessageChannel();
    const controller = { postMessage: vi.fn() };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    vi.useFakeTimers();

    runScript();
    await Promise.resolve();
    await Promise.resolve();

    expect(closedPorts).toHaveLength(0);
    vi.advanceTimersByTime(WATCHDOG_ACK_TIMEOUT_MS);

    expect(closedPorts.length).toBeGreaterThan(0);
  });

  it('closes the already-created receiving port immediately when postMessage throws synchronously', async () => {
    const closedPorts = stubFakePortMessageChannel();
    const controller = {
      postMessage: () => {
        throw new Error('postMessage failed');
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    runScript();
    await Promise.resolve();
    await Promise.resolve();

    expect(closedPorts.length).toBeGreaterThan(0);
  });
});

describe('boot outcome arbitration: BOOT_OK and BOOT_FAILED are never concurrently in flight', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  /**
   * Runs the watchdog against a controller that immediately answers
   * `GET_ACTIVATION_STATUS` with `isActivationTarget: false` (armed, no
   * deadline timer) and captures the most recently opened `MessagePort` for
   * each of `BOOT_OK`/`BOOT_FAILED`, without auto-replying to either, so a
   * test can control exactly when -- or whether -- each acknowledgement is
   * delivered.
   * @returns The list of messages sent to the controller (live-updated) and
   * the captured ports, keyed by message type.
   */
  function createControlledArbitrationController() {
    const postMessageCalls = [];
    const ports = {};
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: false });
          return;
        }
        if (message.type === 'BOOT_FAILED') {
          ports.bootFailed = transfer[0];
        }
        if (message.type === 'BOOT_OK') {
          ports.bootOk = transfer[0];
        }
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });
    return { postMessageCalls, ports };
  }

  async function startWatchdog(releaseNumber = 1) {
    const setup = createControlledArbitrationController();
    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(releaseNumber))();
    await Promise.resolve();
    await flushTasks();
    return setup;
  }

  function hasType(postMessageCalls, type) {
    return postMessageCalls.some((message) => message.type === type);
  }

  it('failure observed first blocks a concurrently requested success; a durable rollback discards the deferred success with exactly one reload', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const { postMessageCalls, ports } = await startWatchdog();

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(true);
    expect(ports.bootFailed).toBeDefined();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);

    ports.bootFailed.postMessage({ protocolVersion: 1, ack: 'rolled-back' });
    await flushTasks();

    expect(reload).toHaveBeenCalledTimes(1);
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);
  });

  it('an ignored failure releases a deferred success, which then commits and settles without reload', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const { postMessageCalls, ports } = await startWatchdog();

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(true);

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);

    ports.bootFailed.postMessage({ protocolVersion: 1, ack: 'ignored' });
    await flushTasks();

    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(true);
    expect(ports.bootOk).toBeDefined();

    ports.bootOk.postMessage({ protocolVersion: 1, ack: 'committed' });
    await flushTasks();

    expect(reload).not.toHaveBeenCalled();
  });

  it('an unconfirmed/timed-out failure acknowledgement keeps the watchdog fail-closed: a deferred success is never sent, and the failure stays retriable', async () => {
    // Uses fake timers from the start (rather than the shared
    // startWatchdog()/flushTasks() helpers, which drive real macrotasks) so
    // the BOOT_FAILED acknowledgement's ack-timeout can be advanced
    // deterministically instead of actually waiting it out.
    vi.useFakeTimers();
    const postMessageCalls = [];
    const controller = {
      postMessage: (message, transfer) => {
        postMessageCalls.push(message);
        if (message.type === 'GET_ACTIVATION_STATUS') {
          transfer[0].postMessage({ protocolVersion: 1, isActivationTarget: false });
        }
        // BOOT_FAILED is deliberately never acknowledged here, so its
        // acknowledgement times out.
      },
    };
    vi.stubGlobal('navigator', {
      serviceWorker: { ready: Promise.resolve(), controller, addEventListener: vi.fn() },
    });

    // oxlint-disable-next-line no-implied-eval -- runs the built watchdog source in isolation to prove real runtime behavior, not user input.
    new Function(buildWatchdogScript(1))();
    await vi.advanceTimersByTimeAsync(0);

    window.dispatchEvent(new Event('error'));
    await vi.advanceTimersByTimeAsync(0);
    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(true);

    window.mioframeAppUpdateBootOk();
    await vi.advanceTimersByTimeAsync(0);
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);

    // Let the BOOT_FAILED acknowledgement time out without ever replying.
    await vi.advanceTimersByTimeAsync(WATCHDOG_ACK_TIMEOUT_MS);
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);

    const bootFailedCallsBeforeRetry = postMessageCalls.filter(
      (message) => message.type === 'BOOT_FAILED',
    ).length;

    // Fail-closed but retriable: a later fatal error reports BOOT_FAILED
    // again, and the deferred success still does not overtake it.
    window.dispatchEvent(new Event('error'));
    await vi.advanceTimersByTimeAsync(0);
    const bootFailedCallsAfterRetry = postMessageCalls.filter(
      (message) => message.type === 'BOOT_FAILED',
    ).length;
    expect(bootFailedCallsAfterRetry).toBeGreaterThan(bootFailedCallsBeforeRetry);
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(false);
  });

  it('success observed first blocks a concurrently requested failure; a durable commit discards the deferred failure', async () => {
    const reload = vi.spyOn(window.location, 'reload').mockImplementation(() => {});
    const { postMessageCalls, ports } = await startWatchdog();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(true);
    expect(ports.bootOk).toBeDefined();

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(false);

    ports.bootOk.postMessage({ protocolVersion: 1, ack: 'committed' });
    await flushTasks();

    // Settled by the committed acknowledgement: a later fatal error must
    // send nothing, proving the deferred failure was discarded rather than
    // merely delayed.
    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });

  it('a success acknowledgement with no durable outcome releases a deferred failure to proceed', async () => {
    const { postMessageCalls, ports } = await startWatchdog();

    window.mioframeAppUpdateBootOk();
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_OK')).toBe(true);

    window.dispatchEvent(new Event('error'));
    await flushTasks();
    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(false);

    ports.bootOk.postMessage({ protocolVersion: 1, ack: 'ignored' });
    await flushTasks();

    expect(hasType(postMessageCalls, 'BOOT_FAILED')).toBe(true);
  });
});

describe('injectWatchdogScript', () => {
  it('inserts the watchdog script immediately before the main module entry', () => {
    const html =
      '<html><head></head><body><script type="module" src="/assets/app.js"></script></body></html>';
    const result = injectWatchdogScript(html, 1);

    const watchdogIndex = result.indexOf('<script>(function ()');
    const mainEntryIndex = result.indexOf('<script type="module"');
    expect(watchdogIndex).toBeGreaterThan(-1);
    expect(watchdogIndex).toBeLessThan(mainEntryIndex);
  });

  it('embeds the given release number in the injected script', () => {
    const html = '<script type="module" src="/assets/app.js"></script>';
    const result = injectWatchdogScript(html, 42);
    expect(result).toContain('var RELEASE_NUMBER = 42;');
  });

  it('throws when no main module entry script tag is found', () => {
    expect(() => injectWatchdogScript('<html><body>no entry here</body></html>', 1)).toThrow(
      'Could not find the main module script entry',
    );
  });
});
