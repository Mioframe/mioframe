import { describe, expect, it, vi } from 'vitest';
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

/**
 * Executes a built watchdog script against a stubbed `navigator.serviceWorker`
 * that answers `GET_ACTIVATION_STATUS` with `response`, then returns every
 * message the stubbed controller received via `postMessage` so a test can
 * assert on real runtime behavior rather than only the script's source text.
 * @param releaseId - The release id to build the watchdog script for.
 * @param response - The `GET_ACTIVATION_STATUS` response to simulate.
 * @returns The list of messages sent to the controller, live-updated as the script runs.
 */
async function runWatchdogWithActivationStatusResponse(releaseId, response) {
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

  new Function(buildWatchdogScript(releaseId))();

  // Flushes the `ready.then(...)` microtask, then the MessageChannel round trip.
  await Promise.resolve();
  await flushTasks();
  await flushTasks();

  return postMessageCalls;
}

describe('buildWatchdogScript', () => {
  it('embeds the exact release id as a JSON string literal', () => {
    const script = buildWatchdogScript('release-abc-123');
    expect(script).toContain('var RELEASE_ID = "release-abc-123";');
  });

  it('safely escapes a release id containing special characters', () => {
    const script = buildWatchdogScript('weird"id</script>');
    expect(script).toContain(JSON.stringify('weird"id</script>'));
    expect(script).not.toContain('</script>weird');
  });

  it('references every required private protocol message type', () => {
    const script = buildWatchdogScript('release-1');
    expect(script).toContain("'BOOT_OK'");
    expect(script).toContain("'BOOT_FAILED'");
    expect(script).toContain("'GET_ACTIVATION_STATUS'");
    expect(script).toContain("'APP_UPDATE_ROLLBACK'");
  });

  it('exposes exactly one narrow function for the app to report successful boot', () => {
    const script = buildWatchdogScript('release-1');
    expect(script).toContain('window.mioframeAppUpdateBootOk = function');
  });

  it('installs early error and unhandledrejection listeners', () => {
    const script = buildWatchdogScript('release-1');
    expect(script).toContain("window.addEventListener('error', onEarlyFatalError)");
    expect(script).toContain("window.addEventListener('unhandledrejection', onEarlyFatalError)");
  });

  it('sends BOOT_OK and BOOT_FAILED through an acknowledged MessageChannel request, not a bare postMessage', () => {
    const script = buildWatchdogScript('release-1');
    expect(script).toContain('function sendToController(message)');
    expect(script).toContain('new MessageChannel()');
    expect(script).toContain('sendToController({ type: BOOT_OK, releaseId: RELEASE_ID })');
    expect(script).toContain('sendToController({ type: BOOT_FAILED, releaseId: RELEASE_ID })');
  });

  it('only disarms on a BOOT_OK response acknowledging a committed outcome', () => {
    const script = buildWatchdogScript('release-1');
    const bootOkBody = script.slice(
      script.indexOf('window.mioframeAppUpdateBootOk = function'),
      script.indexOf('if (navigator.serviceWorker) {'),
    );
    expect(bootOkBody).toContain("response.ack === 'committed'");
    // Disarming (clearing the deadline timer and removing the early-error
    // listeners) must be conditioned on that check, not unconditional.
    expect(bootOkBody.indexOf("response.ack === 'committed'")).toBeLessThan(
      bootOkBody.indexOf('clearTimeout(deadlineTimer)'),
    );
  });

  it('shows a recovery message and never reloads when rollback persistence itself fails', () => {
    const script = buildWatchdogScript('release-1');
    const reportBootFailedBody = script.slice(
      script.indexOf('function reportBootFailed'),
      script.indexOf('function onEarlyFatalError'),
    );
    expect(reportBootFailedBody).toContain("ack === 'error'");
    expect(reportBootFailedBody).toContain('showRecoveryMessage()');
    expect(reportBootFailedBody).not.toContain('location.reload');
  });

  it('disarms outside activation: isActivationTarget === false sets settled, clears the deadline timer, and removes the early-error listeners', () => {
    const script = buildWatchdogScript('release-1');
    const activationStatusBody = script.slice(
      script.indexOf(
        'channel.port1.onmessage = function (event) {\n        var data = event.data;\n        if (data && data.isActivationTarget === false) {',
      ),
      script.indexOf('if (!data || !data.isActivationTarget || !data.deadlineAt) return;'),
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
    const script = buildWatchdogScript('release-1');
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
    const calls = await runWatchdogWithActivationStatusResponse('release-1', {
      isActivationTarget: false,
    });
    expect(calls).toEqual([{ type: 'GET_ACTIVATION_STATUS', releaseId: 'release-1' }]);

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(false);

    vi.unstubAllGlobals();
  });

  it('a true activation target remains armed: a later runtime error still reports BOOT_FAILED', async () => {
    const deadlineAt = new Date(Date.now() + 60_000).toISOString();
    const calls = await runWatchdogWithActivationStatusResponse('release-1', {
      isActivationTarget: true,
      deadlineAt,
    });

    window.dispatchEvent(new Event('error'));
    await flushTasks();

    expect(calls.some((message) => message.type === 'BOOT_FAILED')).toBe(true);

    vi.unstubAllGlobals();
  });
});

describe('injectWatchdogScript', () => {
  it('inserts the watchdog script immediately before the main module entry', () => {
    const html =
      '<html><head></head><body><script type="module" src="/assets/app.js"></script></body></html>';
    const result = injectWatchdogScript(html, 'release-1');

    const watchdogIndex = result.indexOf('<script>(function ()');
    const mainEntryIndex = result.indexOf('<script type="module"');
    expect(watchdogIndex).toBeGreaterThan(-1);
    expect(watchdogIndex).toBeLessThan(mainEntryIndex);
  });

  it('embeds the given release id in the injected script', () => {
    const html = '<script type="module" src="/assets/app.js"></script>';
    const result = injectWatchdogScript(html, 'release-xyz');
    expect(result).toContain('var RELEASE_ID = "release-xyz";');
  });

  it('throws when no main module entry script tag is found', () => {
    expect(() =>
      injectWatchdogScript('<html><body>no entry here</body></html>', 'release-1'),
    ).toThrow('Could not find the main module script entry');
  });
});
