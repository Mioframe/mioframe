import { describe, expect, it } from 'vitest';
import {
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from '../../../../scripts/pages/lib/releaseDescriptorCorpus.mjs';
import { toReleaseRef, zodReleaseDescriptor, zodUpdateControllerState } from './contracts';

describe('zodReleaseDescriptor', () => {
  it('accepts the shared valid release descriptor fixture', () => {
    expect(zodReleaseDescriptor.safeParse(validReleaseDescriptor).success).toBe(true);
  });

  it.each(invalidReleaseDescriptors)('rejects: $name', ({ descriptor }) => {
    expect(zodReleaseDescriptor.safeParse(descriptor).success).toBe(false);
  });
});

describe('toReleaseRef', () => {
  it('extracts only releaseId and releaseSequence', () => {
    const parsed = zodReleaseDescriptor.parse(validReleaseDescriptor);
    expect(toReleaseRef(parsed)).toEqual({
      releaseId: parsed.releaseId,
      releaseSequence: parsed.releaseSequence,
    });
  });
});

const validControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
  failedReleaseIds: [],
};

describe('zodUpdateControllerState', () => {
  it('accepts the minimal valid state (no optional fields)', () => {
    expect(zodUpdateControllerState.safeParse(validControllerState).success).toBe(true);
  });

  it('accepts every optional field populated', () => {
    const full = {
      ...validControllerState,
      mode: 'automatic',
      latestRelease: { releaseId: 'release-b', releaseSequence: 2 },
      approvedRelease: { releaseId: 'release-b', releaseSequence: 2 },
      activation: {
        targetRelease: { releaseId: 'release-b', releaseSequence: 2 },
        previousRelease: { releaseId: 'release-a', releaseSequence: 1 },
        startedAt: '2026-07-24T00:00:00.000Z',
        deadlineAt: '2026-07-24T00:00:30.000Z',
      },
      failedReleaseIds: ['release-c'],
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    };
    expect(zodUpdateControllerState.safeParse(full).success).toBe(true);
  });

  it('rejects an unsupported schemaVersion (fail closed, not default-fallback)', () => {
    expect(
      zodUpdateControllerState.safeParse({ ...validControllerState, schemaVersion: 999 }).success,
    ).toBe(false);
  });

  it('rejects an invalid mode', () => {
    expect(
      zodUpdateControllerState.safeParse({ ...validControllerState, mode: 'eager' }).success,
    ).toBe(false);
  });

  it('rejects a structurally invalid activation', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activation: { targetRelease: validControllerState.activeRelease },
      }).success,
    ).toBe(false);
  });

  it('rejects a non-string entry in failedReleaseIds', () => {
    expect(
      zodUpdateControllerState.safeParse({ ...validControllerState, failedReleaseIds: [1] })
        .success,
    ).toBe(false);
  });
});
