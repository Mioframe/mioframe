import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
      addedWindowListeners.push([type, listener]);
    }
    return realAddEventListener(type, listener, options);
  });
});

afterEach(() => {
  for (const [type, listener] of addedWindowListeners) {
    realRemoveEventListener(type, listener);
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
    expect(script).toContain("window.addEventListener('error', onEarlyFatalError)");
    expect(script).toContain("window.addEventListener('unhandledrejection', onEarlyFatalError)");
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

  it('disarms outside activation: isActivationTarget === false sets settled, clears the deadline timer, and removes the early-error listeners', () => {
    const script = buildWatchdogScript(1);
    const activationStatusBody = script.slice(
      script.indexOf('channel.port1.onmessage = function (event) {'),
      script.indexOf('var msRemaining = parsed.deadlineAtMs'),
    );
    expect(activationStatusBody).toContain('settled = true;');
    expect(activationStatusBody).toContain('clearTimeout(deadlineTimer)');
    expect(activationStatusBody).toContain(
      "window.removeEventListener('error', onEarlyFatalError)",
    );
    expect(activationStatusBody).toContain(
      "window.removeEventListener('unhandledrejection', onEarlyFatalError)",
    );
  });

  it('reloads only on the controller rollback broadcast, not immediately on failure', () => {
    const script = buildWatchdogScript(1);
    const reportBootFailedBody = script.slice(
      script.indexOf('function reportBootFailed'),
      script.indexOf('function onEarlyFatalError'),
    );
    expect(reportBootFailedBody).not.toContain('location.reload');
    expect(script).toContain('location.reload()');
  });
});

describe('watchdog disarm outside activation', () => {
  it('permanently disarms when isActivationTarget is false: a later runtime error never reports BOOT_FAILED', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: false,
    });
    expect(calls).toEqual([
      { protocolVersion: 1, type: 'GET_ACTIVATION_STATUS', releaseNumber: 1 },
    ]);

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

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

  it('a false variant with unrelated deadline fields still disarms (additive v1 fields do not break parsing)', async () => {
    const calls = await runWatchdogWithActivationStatusResponse(1, {
      protocolVersion: 1,
      isActivationTarget: false,
      deadlineAt: 'not-a-valid-date',
    });

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

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
