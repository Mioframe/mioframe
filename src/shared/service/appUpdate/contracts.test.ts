import { describe, expect, it } from 'vitest';
import {
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from '../../../../scripts/pages/lib/releaseDescriptorCorpus.mjs';
import {
  toReleaseRef,
  toReleaseSummary,
  zodReleaseDescriptor,
  zodReleaseSummary,
  zodUpdateControllerState,
} from './contracts';

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

describe('toReleaseSummary', () => {
  it('extracts identity plus exact appVersion, buildId, and buildDate from a validated descriptor', () => {
    const parsed = zodReleaseDescriptor.parse(validReleaseDescriptor);
    const summary = toReleaseSummary(parsed);
    expect(summary).toEqual({
      releaseId: parsed.releaseId,
      releaseSequence: parsed.releaseSequence,
      appVersion: parsed.appVersion,
      buildId: parsed.buildId,
      buildDate: parsed.buildDate,
    });
    expect(zodReleaseSummary.safeParse(summary).success).toBe(true);
  });

  it.each(invalidReleaseDescriptors)(
    'never produces a summary from an invalid descriptor: $name',
    ({ descriptor }) => {
      const parsed = zodReleaseDescriptor.safeParse(descriptor);
      expect(parsed.success).toBe(false);
    },
  );
});

const RELEASE_A = '11111111-1111-4111-8111-111111111111';
const RELEASE_B = '22222222-2222-4222-8222-222222222222';
const RELEASE_C = '33333333-3333-4333-8333-333333333333';

const validControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: { releaseId: RELEASE_A, releaseSequence: 1 },
};

const releaseSummaryB = {
  releaseId: RELEASE_B,
  releaseSequence: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const releaseSummaryC = {
  releaseId: RELEASE_C,
  releaseSequence: 3,
  appVersion: '1.2.0',
  buildId: 'build-c',
  buildDate: '2026-07-24T00:00:00.000Z',
};

describe('zodUpdateControllerState', () => {
  it('accepts the minimal valid state (no optional fields)', () => {
    expect(zodUpdateControllerState.safeParse(validControllerState).success).toBe(true);
  });

  it('accepts every optional field populated except the mutually exclusive approvedRelease/activation', () => {
    const full = {
      ...validControllerState,
      mode: 'automatic',
      latestRelease: releaseSummaryB,
      activation: {
        targetRelease: releaseSummaryB,
        deadlineAt: '2026-07-24T00:00:30.000Z',
      },
      failedActivationRelease: releaseSummaryC,
      lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
    };
    expect(zodUpdateControllerState.safeParse(full).success).toBe(true);
  });

  it('rejects a latestRelease missing display metadata (bare identity is no longer a valid summary)', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        latestRelease: { releaseId: RELEASE_B, releaseSequence: 2 },
      }).success,
    ).toBe(false);
  });

  it('accepts approvedRelease alone, without an activation', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        approvedRelease: releaseSummaryB,
      }).success,
    ).toBe(true);
  });

  it('rejects approvedRelease and activation coexisting', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        approvedRelease: releaseSummaryB,
        activation: {
          targetRelease: releaseSummaryB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(false);
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

  it('rejects a releaseId not in canonical UUID format', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: { releaseId: 'release-a', releaseSequence: 1 },
      }).success,
    ).toBe(false);
  });

  it('rejects approvedRelease not strictly newer than activeRelease', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: { releaseId: RELEASE_B, releaseSequence: 2 },
        approvedRelease: { ...releaseSummaryB, releaseId: RELEASE_A, releaseSequence: 2 },
      }).success,
    ).toBe(false);
  });

  it('rejects activation.targetRelease not strictly newer than activeRelease', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: { releaseId: RELEASE_B, releaseSequence: 2 },
        activation: {
          targetRelease: { ...releaseSummaryB, releaseId: RELEASE_A, releaseSequence: 1 },
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects a same-sequence, different-releaseId conflict between two release references', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        latestRelease: {
          ...releaseSummaryB,
          releaseSequence: validControllerState.activeRelease.releaseSequence,
        },
      }).success,
    ).toBe(false);
  });

  it('rejects a same-releaseId, different-releaseSequence conflict between two release references', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        failedActivationRelease: {
          ...releaseSummaryB,
          releaseId: validControllerState.activeRelease.releaseId,
        },
      }).success,
    ).toBe(false);
  });
});
