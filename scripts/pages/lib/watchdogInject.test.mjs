import { describe, expect, it } from 'vitest';
import { buildWatchdogScript, injectWatchdogScript } from './watchdogInject.mjs';

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
