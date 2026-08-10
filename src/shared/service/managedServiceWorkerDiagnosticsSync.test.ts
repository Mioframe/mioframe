import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncDiagnosticsPolicyToManagedServiceWorker } from './managedServiceWorkerDiagnosticsSync';

const TEST_SESSION_ID = 'session:aaaabbbb-cccc-dddd-eeee-ffffaaaabbbb';

describe('syncDiagnosticsPolicyToManagedServiceWorker', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is a no-op without serviceWorker support', () => {
    vi.stubGlobal('navigator', {});

    expect(() => {
      syncDiagnosticsPolicyToManagedServiceWorker({
        reportingState: 'enabled',
        sessionId: TEST_SESSION_ID,
      });
    }).not.toThrow();
  });

  it('is a no-op when there is no controller', () => {
    vi.stubGlobal('navigator', { serviceWorker: { controller: null } });

    expect(() => {
      syncDiagnosticsPolicyToManagedServiceWorker({
        reportingState: 'enabled',
        sessionId: TEST_SESSION_ID,
      });
    }).not.toThrow();
  });

  it('posts the diagnostics-policy sync message to the controlling worker', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } });

    syncDiagnosticsPolicyToManagedServiceWorker({
      reportingState: 'enabled',
      sessionId: TEST_SESSION_ID,
    });

    expect(postMessage).toHaveBeenCalledWith({
      type: 'DIAGNOSTICS_POLICY_SYNC',
      reportingState: 'enabled',
      sessionId: TEST_SESSION_ID,
    });
  });

  it('never sends updater protocol fields alongside the sync message', () => {
    const postMessage = vi.fn();
    vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } });

    syncDiagnosticsPolicyToManagedServiceWorker({
      reportingState: 'disabled',
      sessionId: TEST_SESSION_ID,
    });

    const sent = postMessage.mock.calls[0]?.[0];
    expect(Object.keys(sent)).toEqual(['type', 'reportingState', 'sessionId']);
  });

  it('swallows a synchronously throwing postMessage', () => {
    const postMessage = vi.fn(() => {
      throw new Error('transport failure');
    });
    vi.stubGlobal('navigator', { serviceWorker: { controller: { postMessage } } });

    expect(() => {
      syncDiagnosticsPolicyToManagedServiceWorker({
        reportingState: 'unknown',
        sessionId: TEST_SESSION_ID,
      });
    }).not.toThrow();
  });
});
