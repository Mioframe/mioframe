import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UpdateControllerState } from './contracts';

const getMock = vi.fn();
const setMock = vi.fn();
const createStoreMock = vi.fn((dbName: string, storeName: string) => ({ dbName, storeName }));

vi.mock('idb-keyval', () => ({
  get: (...args: unknown[]) => getMock(...args),
  set: (...args: unknown[]) => setMock(...args),
  createStore: (...args: [string, string]) => createStoreMock(...args),
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
    });
  });

  it('fails closed for a structurally unrelated value', async () => {
    const { parseControllerState } = await import('./controllerState');
    expect(parseControllerState('not-an-object')).toEqual({ status: 'invalid' });
  });
});

describe('buildControllerStateDbName', () => {
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
});
