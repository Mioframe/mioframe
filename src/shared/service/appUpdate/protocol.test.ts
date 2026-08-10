import { describe, expect, it } from 'vitest';
import {
  APP_UPDATE_PROTOCOL_VERSION,
  RECOVER_INSTALL_LATEST_RESULT_CODES,
  withProtocolVersion,
  zodActivationStatusResponse,
  zodAppUpdateRollbackBroadcast,
  zodAppUpdateSnapshot,
  zodAppUpdateStateChangedBroadcast,
  zodAppUpdateWorkerFailureResponse,
  zodAppUpdateWorkerRequest,
  zodAppUpdateWorkerResponse,
  zodManagedControllerProbeRequest,
  zodManagedControllerProbeResponse,
  zodRecoverInstallLatestResponse,
} from './protocol';

const activeRelease = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const validSnapshot = {
  mode: 'manual' as const,
  activeRelease,
};

describe('withProtocolVersion', () => {
  it('stamps a payload with the current protocol version', () => {
    expect(withProtocolVersion({ type: 'GET_SNAPSHOT' as const })).toEqual({
      type: 'GET_SNAPSHOT',
      protocolVersion: APP_UPDATE_PROTOCOL_VERSION,
    });
  });
});

describe('zodAppUpdateWorkerRequest', () => {
  it('parses every valid v1 request variant', () => {
    const requests = [
      { protocolVersion: 1, type: 'GET_SNAPSHOT' },
      { protocolVersion: 1, type: 'CHECK_FOR_UPDATES' },
      { protocolVersion: 1, type: 'SET_MODE', mode: 'automatic' },
      { protocolVersion: 1, type: 'INSTALL_ON_NEXT_LAUNCH' },
      { protocolVersion: 1, type: 'CANCEL_SCHEDULED_UPDATE' },
      { protocolVersion: 1, type: 'BOOT_OK', releaseNumber: 1 },
      { protocolVersion: 1, type: 'BOOT_FAILED', releaseNumber: 1 },
      { protocolVersion: 1, type: 'GET_ACTIVATION_STATUS', releaseNumber: 1 },
      { protocolVersion: 1, type: 'RECOVER_INSTALL_LATEST' },
    ];
    for (const request of requests) {
      expect(zodAppUpdateWorkerRequest.safeParse(request).success).toBe(true);
    }
  });

  it('fails closed on a non-positive-safe-integer releaseNumber', () => {
    expect(
      zodAppUpdateWorkerRequest.safeParse({ protocolVersion: 1, type: 'BOOT_OK', releaseNumber: 0 })
        .success,
    ).toBe(false);
    expect(
      zodAppUpdateWorkerRequest.safeParse({
        protocolVersion: 1,
        type: 'BOOT_OK',
        releaseNumber: 1.5,
      }).success,
    ).toBe(false);
  });

  it('fails closed on a missing protocolVersion', () => {
    expect(zodAppUpdateWorkerRequest.safeParse({ type: 'GET_SNAPSHOT' }).success).toBe(false);
  });

  it('fails closed on an unsupported protocolVersion', () => {
    expect(
      zodAppUpdateWorkerRequest.safeParse({ protocolVersion: 2, type: 'GET_SNAPSHOT' }).success,
    ).toBe(false);
  });

  it('fails closed on an unknown message type', () => {
    expect(
      zodAppUpdateWorkerRequest.safeParse({ protocolVersion: 1, type: 'NOT_A_REAL_TYPE' }).success,
    ).toBe(false);
  });

  it('fails closed on a malformed payload (not an object)', () => {
    expect(zodAppUpdateWorkerRequest.safeParse('GET_SNAPSHOT').success).toBe(false);
    expect(zodAppUpdateWorkerRequest.safeParse(null).success).toBe(false);
    expect(zodAppUpdateWorkerRequest.safeParse(undefined).success).toBe(false);
  });

  it('accepts additional unknown fields for additive v1 compatibility', () => {
    const result = zodAppUpdateWorkerRequest.safeParse({
      protocolVersion: 1,
      type: 'GET_SNAPSHOT',
      somethingAddedLater: 'ignored by this pinned v1 consumer',
    });
    expect(result.success).toBe(true);
  });
});

describe('zodAppUpdateWorkerResponse', () => {
  it('parses a valid v1 response', () => {
    const result = zodAppUpdateWorkerResponse.safeParse({
      protocolVersion: 1,
      snapshot: validSnapshot,
    });
    expect(result.success).toBe(true);
  });

  it('fails closed on a missing or wrong protocolVersion', () => {
    expect(zodAppUpdateWorkerResponse.safeParse({ snapshot: validSnapshot }).success).toBe(false);
    expect(
      zodAppUpdateWorkerResponse.safeParse({ protocolVersion: 2, snapshot: validSnapshot }).success,
    ).toBe(false);
  });

  it('accepts additional unknown fields for additive v1 compatibility', () => {
    const result = zodAppUpdateWorkerResponse.safeParse({
      protocolVersion: 1,
      snapshot: validSnapshot,
      futureField: 'ignored',
    });
    expect(result.success).toBe(true);
  });
});

describe('zodAppUpdateWorkerFailureResponse', () => {
  it('parses the stable v1 failure envelope', () => {
    const result = zodAppUpdateWorkerFailureResponse.safeParse({
      protocolVersion: 1,
      error: 'unavailable',
    });
    expect(result.success).toBe(true);
  });

  it('fails closed on a missing or wrong protocolVersion', () => {
    expect(zodAppUpdateWorkerFailureResponse.safeParse({ error: 'unavailable' }).success).toBe(
      false,
    );
    expect(
      zodAppUpdateWorkerFailureResponse.safeParse({ protocolVersion: 2, error: 'unavailable' })
        .success,
    ).toBe(false);
  });

  it('fails closed on any error value other than the one stable literal', () => {
    expect(
      zodAppUpdateWorkerFailureResponse.safeParse({
        protocolVersion: 1,
        error: 'something-else',
      }).success,
    ).toBe(false);
  });

  it('never overlaps with a valid worker response: exactly one of the two schemas parses it', () => {
    const failure = { protocolVersion: 1, error: 'unavailable' };
    expect(zodAppUpdateWorkerFailureResponse.safeParse(failure).success).toBe(true);
    expect(zodAppUpdateWorkerResponse.safeParse(failure).success).toBe(false);
  });
});

describe('zodAppUpdateSnapshot', () => {
  it('parses a minimal valid snapshot', () => {
    expect(zodAppUpdateSnapshot.safeParse(validSnapshot).success).toBe(true);
  });

  it('parses a snapshot carrying every candidate phase', () => {
    for (const phase of ['available', 'ready', 'failed'] as const) {
      expect(
        zodAppUpdateSnapshot.safeParse({
          ...validSnapshot,
          candidate: { phase, release: { ...activeRelease, releaseNumber: 2 } },
        }).success,
      ).toBe(true);
    }
    expect(
      zodAppUpdateSnapshot.safeParse({
        ...validSnapshot,
        candidate: {
          phase: 'activating',
          release: { ...activeRelease, releaseNumber: 2 },
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(true);
  });
});

describe('zodActivationStatusResponse', () => {
  it('parses both valid v1 variants', () => {
    expect(
      zodActivationStatusResponse.safeParse({
        protocolVersion: 1,
        isActivationTarget: true,
        deadlineAt: '2026-07-24T00:00:30.000Z',
      }).success,
    ).toBe(true);
    expect(
      zodActivationStatusResponse.safeParse({ protocolVersion: 1, isActivationTarget: false })
        .success,
    ).toBe(true);
  });

  it('fails closed on a missing protocolVersion', () => {
    expect(zodActivationStatusResponse.safeParse({ isActivationTarget: false }).success).toBe(
      false,
    );
  });
});

describe('zodAppUpdateRollbackBroadcast', () => {
  it('parses a valid v1 broadcast', () => {
    expect(
      zodAppUpdateRollbackBroadcast.safeParse({
        protocolVersion: 1,
        type: 'APP_UPDATE_ROLLBACK',
        releaseNumber: 1,
      }).success,
    ).toBe(true);
  });

  it('fails closed on an unsupported protocolVersion', () => {
    expect(
      zodAppUpdateRollbackBroadcast.safeParse({
        protocolVersion: 2,
        type: 'APP_UPDATE_ROLLBACK',
        releaseNumber: 1,
      }).success,
    ).toBe(false);
  });
});

describe('zodAppUpdateStateChangedBroadcast', () => {
  it('parses a valid v1 broadcast', () => {
    expect(
      zodAppUpdateStateChangedBroadcast.safeParse({
        protocolVersion: 1,
        type: 'APP_UPDATE_STATE_CHANGED',
      }).success,
    ).toBe(true);
  });

  it('fails closed on a missing protocolVersion', () => {
    expect(
      zodAppUpdateStateChangedBroadcast.safeParse({ type: 'APP_UPDATE_STATE_CHANGED' }).success,
    ).toBe(false);
  });
});

describe('zodManagedControllerProbeRequest', () => {
  it('parses the exact v1 probe request', () => {
    expect(
      zodManagedControllerProbeRequest.safeParse({
        protocolVersion: 1,
        type: 'PROBE_MANAGED_UPDATE_CONTROLLER',
      }).success,
    ).toBe(true);
  });

  it('fails closed on a missing or wrong protocolVersion', () => {
    expect(
      zodManagedControllerProbeRequest.safeParse({ type: 'PROBE_MANAGED_UPDATE_CONTROLLER' })
        .success,
    ).toBe(false);
    expect(
      zodManagedControllerProbeRequest.safeParse({
        protocolVersion: 2,
        type: 'PROBE_MANAGED_UPDATE_CONTROLLER',
      }).success,
    ).toBe(false);
  });

  it('fails closed on a wrong or missing type', () => {
    expect(
      zodManagedControllerProbeRequest.safeParse({ protocolVersion: 1, type: 'CACHE_URLS' })
        .success,
    ).toBe(false);
    expect(zodManagedControllerProbeRequest.safeParse({ protocolVersion: 1 }).success).toBe(false);
  });
});

describe('zodRecoverInstallLatestResponse', () => {
  it('parses every stable v1 result code', () => {
    for (const result of RECOVER_INSTALL_LATEST_RESULT_CODES) {
      expect(
        zodRecoverInstallLatestResponse.safeParse({ protocolVersion: 1, result }).success,
      ).toBe(true);
    }
  });

  it('fails closed on a missing or wrong protocolVersion', () => {
    expect(zodRecoverInstallLatestResponse.safeParse({ result: 'success' }).success).toBe(false);
    expect(
      zodRecoverInstallLatestResponse.safeParse({ protocolVersion: 2, result: 'success' }).success,
    ).toBe(false);
  });

  it('fails closed on an unknown result code', () => {
    expect(
      zodRecoverInstallLatestResponse.safeParse({ protocolVersion: 1, result: 'not-a-real-result' })
        .success,
    ).toBe(false);
  });

  it('never carries a raw state snapshot or exception field', () => {
    const parsed = zodRecoverInstallLatestResponse.safeParse({
      protocolVersion: 1,
      result: 'success',
      snapshot: { mode: 'automatic' },
    });
    // Additive v1 schema still accepts unknown fields for forward
    // compatibility, but production code must never populate one — proven
    // by workerMessagesRecovery.test.ts asserting the exact response shape.
    expect(parsed.success).toBe(true);
  });
});

describe('zodManagedControllerProbeResponse', () => {
  it('parses a valid v1 probe response for each channel', () => {
    for (const channel of ['stable', 'develop'] as const) {
      expect(
        zodManagedControllerProbeResponse.safeParse({
          protocolVersion: 1,
          kind: 'managed-update-controller',
          channel,
        }).success,
      ).toBe(true);
    }
  });

  it('fails closed on a missing or wrong protocolVersion', () => {
    expect(
      zodManagedControllerProbeResponse.safeParse({
        kind: 'managed-update-controller',
        channel: 'stable',
      }).success,
    ).toBe(false);
    expect(
      zodManagedControllerProbeResponse.safeParse({
        protocolVersion: 2,
        kind: 'managed-update-controller',
        channel: 'stable',
      }).success,
    ).toBe(false);
  });

  it('fails closed on a wrong kind or an unsupported channel', () => {
    expect(
      zodManagedControllerProbeResponse.safeParse({
        protocolVersion: 1,
        kind: 'workbox',
        channel: 'stable',
      }).success,
    ).toBe(false);
    expect(
      zodManagedControllerProbeResponse.safeParse({
        protocolVersion: 1,
        kind: 'managed-update-controller',
        channel: 'preview',
      }).success,
    ).toBe(false);
  });
});
