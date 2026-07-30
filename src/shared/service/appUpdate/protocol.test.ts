import { describe, expect, it } from 'vitest';
import {
  APP_UPDATE_PROTOCOL_VERSION,
  withProtocolVersion,
  zodActivationStatusResponse,
  zodAppUpdateRollbackBroadcast,
  zodAppUpdateSnapshot,
  zodAppUpdateStateChangedBroadcast,
  zodAppUpdateWorkerRequest,
  zodAppUpdateWorkerResponse,
} from './protocol';

const activeRelease = { releaseId: '11111111-1111-4111-8111-111111111111', releaseSequence: 1 };

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
      { protocolVersion: 1, type: 'BOOT_OK', releaseId: 'release-a' },
      { protocolVersion: 1, type: 'BOOT_FAILED', releaseId: 'release-a' },
      { protocolVersion: 1, type: 'GET_ACTIVATION_STATUS', releaseId: 'release-a' },
    ];
    for (const request of requests) {
      expect(zodAppUpdateWorkerRequest.safeParse(request).success).toBe(true);
    }
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

describe('zodAppUpdateSnapshot', () => {
  it('parses a minimal valid snapshot', () => {
    expect(zodAppUpdateSnapshot.safeParse(validSnapshot).success).toBe(true);
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
        releaseId: 'release-a',
      }).success,
    ).toBe(true);
  });

  it('fails closed on an unsupported protocolVersion', () => {
    expect(
      zodAppUpdateRollbackBroadcast.safeParse({
        protocolVersion: 2,
        type: 'APP_UPDATE_ROLLBACK',
        releaseId: 'release-a',
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
