/**
 * Integration test proving diagnostics forwarding performs a real proxyService roundtrip
 * from a simulated worker-side client to the main-thread diagnostics service.
 *
 * Uses the same MockProvider / channel pattern as proxyService.test.ts.
 * Main thread and worker share a JS context in tests, so the test client uses a
 * unique return ID (not DIAGNOSTICS_SERVICE_ID) to avoid the duplicate-registration
 * guard that proxyService enforces across real execution contexts.
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ClientObject, Provider } from '@shared/lib/proxyService';
import { createClient } from '@shared/lib/proxyService';
import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
  setDiagnosticEventForwarder,
  setDiagnosticEventSink,
} from '@shared/lib/diagnostics';
import type { DiagnosticEvent } from '@shared/lib/diagnostics';
import { transformers } from '@shared/lib/wrapWorker/workerTransformerMap';
import { DIAGNOSTICS_SERVICE_ID, registerMainThreadDiagnosticsService } from './diagnosticsService';

class MockProvider implements Provider {
  private listeners: Set<(p: { data: unknown }) => void> = new Set();
  peer: MockProvider | null = null;

  constructor(
    public readonly myId: string,
    public readonly peerId: string,
  ) {}

  postMessage(data: unknown): void {
    if (!this.peer) return;

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Safe JSON round-trip for serialization testing
    const payload = JSON.parse(JSON.stringify(data)) as Record<string, unknown>;

    if (payload.serviceId === this.myId) {
      payload.serviceId = this.peerId;
    }

    setTimeout(() => {
      for (const listener of this.peer?.listeners ?? []) {
        listener({ data: payload });
      }
    }, 0);
  }

  addEventListener(_type: 'message', handler: (p: { data: unknown }) => void): void {
    this.listeners.add(handler);
  }

  removeEventListener(_type: 'message', handler: (p: { data: unknown }) => void): void {
    this.listeners.delete(handler);
  }
}

/**
 * Bidirectional channel where mainSide owns DIAGNOSTICS_SERVICE_ID and the test
 * client uses `clientReturnId` as its own unique return-service ID.
 * @param clientReturnId - Unique return-service ID for the test client side.
 * @returns A pair of linked MockProvider instances representing the two channel ends.
 */
const createDiagnosticsChannel = (clientReturnId: string) => {
  const mainSide = new MockProvider(DIAGNOSTICS_SERVICE_ID, clientReturnId);
  const clientSide = new MockProvider(clientReturnId, DIAGNOSTICS_SERVICE_ID);
  mainSide.peer = clientSide;
  clientSide.peer = mainSide;
  return { mainSide, clientSide };
};

type DiagnosticsApi = {
  reportDiagnosticEvent: (event: DiagnosticEvent) => void;
};

describe('diagnosticsService — proxyService roundtrip', () => {
  let sink: DiagnosticEvent[];
  let client: ClientObject<DiagnosticsApi>;

  beforeAll(() => {
    vi.useFakeTimers();
    // proxyService uses module-level registries that persist for the module lifetime,
    // so the service is registered once per suite and reused across tests.
    const { mainSide, clientSide } = createDiagnosticsChannel('test-client-return');
    registerMainThreadDiagnosticsService(mainSide);
    client = createClient<DiagnosticsApi>(clientSide, 'test-client-return', transformers);
  });

  beforeEach(() => {
    setDiagnosticEventForwarder(undefined);
    sink = [];
    setDiagnosticEventSink(sink);
  });

  afterEach(() => {
    setDiagnosticEventSink(undefined);
    setDiagnosticEventForwarder(undefined);
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('reportDiagnosticEvent reaches the main-thread in-memory sink via the proxyService channel', async () => {
    // Flush the proxyService handshake (ready / areYouReady exchange).
    await vi.runAllTimersAsync();

    // Send an event through the real proxyService serialization and message routing.
    const callPromise = client.reportDiagnosticEvent({
      name: 'test.proxyRoundtrip',
      severity: DiagnosticSeverity.Info,
      result: DiagnosticResult.Success,
      classification: DiagnosticClassification.Unknown,
    });

    // Flush the async call message and the result back.
    await vi.runAllTimersAsync();

    // The proxy call must have resolved without error.
    await expect(callPromise).resolves.toBeUndefined();

    expect(sink).toHaveLength(1);
    expect(sink[0]).toMatchObject({
      name: 'test.proxyRoundtrip',
      severity: DiagnosticSeverity.Info,
      result: DiagnosticResult.Success,
      classification: DiagnosticClassification.Unknown,
    });
  });
});

describe('diagnosticsService — forwarder hook scope', () => {
  afterEach(() => {
    setDiagnosticEventForwarder(undefined);
    setDiagnosticEventSink(undefined);
  });

  it('setDiagnosticEventForwarder intercepts reportDiagnosticEvent and bypasses Sentry', () => {
    const captured: DiagnosticEvent[] = [];
    setDiagnosticEventForwarder((event) => captured.push(event));

    reportDiagnosticEvent({
      name: 'test.forwarderScope',
      severity: DiagnosticSeverity.Warning,
      result: DiagnosticResult.Failed,
      classification: DiagnosticClassification.Unexpected,
    });

    expect(captured).toHaveLength(1);
    expect(captured[0]?.name).toBe('test.forwarderScope');
  });

  it('setDiagnosticEventForwarder does not leak errors into product code', () => {
    setDiagnosticEventForwarder(() => {
      throw new Error('forwarding failure');
    });

    expect(() => {
      reportDiagnosticEvent({
        name: 'test.errorSuppression',
        severity: DiagnosticSeverity.Error,
        result: DiagnosticResult.Failed,
        classification: DiagnosticClassification.Unexpected,
      });
    }).not.toThrow();
  });
});
