import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const getMock = vi.fn();
const setMock = vi.fn();
const createStoreMock = vi.fn((dbName: string, storeName: string) => ({ dbName, storeName }));
const captureDiagnosticExceptionMock = vi.fn();

vi.mock('idb-keyval', () => ({
  get: (...args: unknown[]) => getMock(...args),
  set: (...args: unknown[]) => setMock(...args),
  createStore: (...args: [string, string]) => createStoreMock(...args),
}));
vi.mock('@shared/lib/diagnostics', () => ({
  captureDiagnosticException: (...args: unknown[]) => captureDiagnosticExceptionMock(...args),
}));

const validState: UpdateControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: {
    releaseNumber: 1,
    appVersion: '1.0.0',
    buildId: 'build-a',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
};

describe('parseControllerState', () => {
  it('reports absent when nothing is persisted', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState(undefined)).toEqual({ status: 'absent' });
  });

  it('reports valid with the parsed state for a well-formed record', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState(validState)).toEqual({ status: 'valid', state: validState });
  });

  it('fails closed (invalid) rather than falling back to a default for a corrupt record', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState({ ...validState, schemaVersion: 999 })).toEqual({
      status: 'invalid',
      reason: 'UNSUPPORTED_SCHEMA_VERSION',
    });
  });

  it('fails closed for a structurally unrelated value', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState('not-an-object')).toEqual({
      status: 'invalid',
      reason: 'MALFORMED_RECORD',
    });
  });

  it('classifies a missing schemaVersion as malformed, not an unsupported version', async () => {
    const { parseControllerState } = await import('./controllerState');
    const { schemaVersion: _schemaVersion, ...withoutSchemaVersion } = validState;
    expect(parseControllerState(withoutSchemaVersion)).toEqual({
      status: 'invalid',
      reason: 'MALFORMED_RECORD',
    });
  });

  it('classifies an unknown strict field as malformed', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(
      parseControllerState({ ...validState, approvedRelease: validState.activeRelease }),
    ).toEqual({
      status: 'invalid',
      reason: 'MALFORMED_RECORD',
    });
  });

  it('classifies a structurally valid record that violates the candidate/active invariant', async () => {
    const { parseControllerState } = await import('./controllerState');
    const invariantViolating = {
      ...validState,
      candidate: { phase: 'available' as const, release: validState.activeRelease },
    };
    expect(parseControllerState(invariantViolating)).toEqual({
      status: 'invalid',
      reason: 'INVARIANT_VIOLATION',
    });
  });

  it('gives UNSUPPORTED_SCHEMA_VERSION precedence even when the record is also otherwise malformed', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState({ schemaVersion: 2, mode: 'not-a-mode' })).toEqual({
      status: 'invalid',
      reason: 'UNSUPPORTED_SCHEMA_VERSION',
    });
  });
});

describe('buildControllerStateDbName', () => {
  it('produces the exact stable database name', async () => {
    const { buildControllerStateDbName } = await import('./controllerState');
    // Asserted as a literal expected value, not derived from
    // buildControllerStateDbName itself, so an accidental change to the
    // production mapping cannot pass merely because the test recomputed the
    // same (now-changed) value.
    expect(buildControllerStateDbName('stable')).toBe('mioframe-update-controller-stable');
  });

  it('produces the exact develop database name', async () => {
    const { buildControllerStateDbName } = await import('./controllerState');
    expect(buildControllerStateDbName('develop')).toBe('mioframe-update-controller-branch-develop');
  });

  it('produces distinct names for stable and develop', async () => {
    const { buildControllerStateDbName } = await import('./controllerState');
    expect(buildControllerStateDbName('stable')).not.toBe(buildControllerStateDbName('develop'));
  });
});

describe('readControllerState / writeControllerState', () => {
  beforeEach(() => {
    getMock.mockReset();
    setMock.mockReset();
    createStoreMock.mockClear();
    captureDiagnosticExceptionMock.mockReset();
  });

  it('reads through a channel-scoped store and parses the result', async () => {
    getMock.mockResolvedValue(validState);
    const { readControllerState, buildControllerStateDbName } = await import('./controllerState');

    const result = await readControllerState('stable');

    expect(result).toEqual({ status: 'valid', state: validState });
    expect(createStoreMock).toHaveBeenCalledWith(
      buildControllerStateDbName('stable'),
      'controllerState',
    );
  });

  it('reads independently scoped stores for stable and develop', async () => {
    getMock.mockResolvedValue(undefined);
    const { readControllerState } = await import('./controllerState');

    await readControllerState('stable');
    await readControllerState('develop');

    const dbNamesUsed = createStoreMock.mock.calls.map(([dbName]) => dbName);
    expect(new Set(dbNamesUsed).size).toBe(2);
  });

  it('writes the complete state through the channel-scoped store', async () => {
    const { writeControllerState, buildControllerStateDbName } = await import('./controllerState');

    await writeControllerState('develop', validState);

    expect(setMock).toHaveBeenCalledWith('controllerState', validState, expect.anything());
    expect(createStoreMock).toHaveBeenCalledWith(
      buildControllerStateDbName('develop'),
      'controllerState',
    );
  });

  it('refuses to persist a state with a non-positive-safe-integer releaseNumber, and never calls idb-keyval set', async () => {
    const { writeControllerState } = await import('./controllerState');
    // `releaseNumber` is typed as plain `number`, so an out-of-range value is
    // structurally valid `UpdateControllerState` as far as the static type is
    // concerned — only the canonical schema's own check catches it, exactly
    // the write-boundary gap this hardening closes.
    const invalidState: UpdateControllerState = {
      ...validState,
      activeRelease: { ...validState.activeRelease, releaseNumber: 0 },
    };

    await expect(writeControllerState('develop', invalidState)).rejects.toThrow(
      'Refusing to persist an invalid controller state',
    );
    expect(setMock).not.toHaveBeenCalled();
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(expect.any(Error), {
      operation: 'controllerStateWrite',
      failureClassification: 'INVALID_WRITE_ATTEMPT',
    });
  });

  it('rejects an invalid write attempt with a classified controller-state write error', async () => {
    const { writeControllerState, isControllerStateWriteError, ControllerStateWriteFailureReason } =
      await import('./controllerState');
    const invalidState: UpdateControllerState = {
      ...validState,
      activeRelease: { ...validState.activeRelease, releaseNumber: 0 },
    };

    let caught: unknown;
    try {
      await writeControllerState('develop', invalidState);
    } catch (error) {
      caught = error;
    }

    expect(isControllerStateWriteError(caught)).toBe(true);
    if (isControllerStateWriteError(caught)) {
      expect(caught.code).toBe(ControllerStateWriteFailureReason.INVALID_WRITE_ATTEMPT);
    }
  });

  it('refuses to persist a candidate that is not strictly newer than activeRelease, even though each field is individually well-formed', async () => {
    const { writeControllerState } = await import('./controllerState');
    const conflictingState: UpdateControllerState = {
      ...validState,
      candidate: {
        phase: 'available',
        release: {
          ...validState.activeRelease,
          releaseNumber: validState.activeRelease.releaseNumber,
        },
      },
    };

    await expect(writeControllerState('develop', conflictingState)).rejects.toThrow(
      'Refusing to persist an invalid controller state',
    );
    expect(setMock).not.toHaveBeenCalled();
  });

  it('classifies a thrown storage read failure as storage-unavailable with an allowlisted error name', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('boom'), { name: 'QuotaExceededError' }));
    const { readControllerState } = await import('./controllerState');

    const result = await readControllerState('stable');

    expect(result).toEqual({ status: 'storage-unavailable', errorName: 'QuotaExceededError' });
  });

  it('omits errorName for a storage read failure outside the allowlist, and never leaks the raw message', async () => {
    getMock.mockRejectedValue(new Error('some internal path or token leaked in this message'));
    const { readControllerState } = await import('./controllerState');

    const result = await readControllerState('stable');

    expect(result).toEqual({ status: 'storage-unavailable', errorName: undefined });
  });

  it('reports a storage read failure via the diagnostics exception primitive, with the raw error only there', async () => {
    const rawError = new Error('IndexedDB unavailable');
    getMock.mockRejectedValue(rawError);
    const { readControllerState } = await import('./controllerState');

    await readControllerState('stable');

    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(rawError, {
      operation: 'controllerStateRead',
      failureClassification: 'storageUnavailable',
    });
  });

  it('reports a storage write failure via the diagnostics exception primitive and still rejects fail-closed', async () => {
    const rawError = new Error('IndexedDB write failed');
    setMock.mockRejectedValue(rawError);
    const { writeControllerState, isControllerStateWriteError, ControllerStateWriteFailureReason } =
      await import('./controllerState');

    let caught: unknown;
    try {
      await writeControllerState('stable', validState);
    } catch (error) {
      caught = error;
    }

    expect(isControllerStateWriteError(caught)).toBe(true);
    if (isControllerStateWriteError(caught)) {
      expect(caught.code).toBe(ControllerStateWriteFailureReason.STORAGE_UNAVAILABLE);
      expect(caught.cause).toBe(rawError);
    }
    expect(captureDiagnosticExceptionMock).toHaveBeenCalledWith(caught, {
      operation: 'controllerStateWrite',
      failureClassification: 'STORAGE_UNAVAILABLE',
    });
  });

  it('refuses to persist a state with an unknown root field, and never calls idb-keyval set', async () => {
    const { writeControllerState } = await import('./controllerState');
    // `approvedRelease` is not part of `UpdateControllerState`'s static
    // shape, so this can only be constructed by widening past the type —
    // exactly the kind of stale or foreign persisted field the strict
    // schema must reject rather than silently strip.
    const invalidState = { ...validState, approvedRelease: validState.activeRelease };

    await expect(writeControllerState('develop', invalidState)).rejects.toThrow(
      'Refusing to persist an invalid controller state',
    );
    expect(setMock).not.toHaveBeenCalled();
  });
});
