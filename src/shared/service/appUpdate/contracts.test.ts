import { describe, expect, it } from 'vitest';
import {
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from '../../../../scripts/pages/lib/releaseDescriptorCorpus.mjs';
import {
  isPositiveSafeInteger,
  toReleaseSummary,
  zodManagedChannel,
  zodReleaseDescriptor,
  zodReleaseSummary,
  zodUpdateControllerState,
} from './contracts';

describe('zodManagedChannel', () => {
  it('accepts stable and develop', () => {
    expect(zodManagedChannel.safeParse('stable').success).toBe(true);
    expect(zodManagedChannel.safeParse('develop').success).toBe(true);
  });

  it('rejects any other value', () => {
    expect(zodManagedChannel.safeParse('preview').success).toBe(false);
    expect(zodManagedChannel.safeParse('').success).toBe(false);
  });
});

describe('isPositiveSafeInteger', () => {
  it('accepts a positive safe integer', () => {
    expect(isPositiveSafeInteger(1)).toBe(true);
    expect(isPositiveSafeInteger(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('rejects zero, negative, non-integer, and unsafe values', () => {
    expect(isPositiveSafeInteger(0)).toBe(false);
    expect(isPositiveSafeInteger(-1)).toBe(false);
    expect(isPositiveSafeInteger(1.5)).toBe(false);
    expect(isPositiveSafeInteger(Number.MAX_SAFE_INTEGER + 1)).toBe(false);
  });
});

describe('zodReleaseDescriptor', () => {
  it('accepts the shared valid release descriptor fixture', () => {
    expect(zodReleaseDescriptor.safeParse(validReleaseDescriptor).success).toBe(true);
  });

  it.each(invalidReleaseDescriptors)('rejects: $name', ({ descriptor }) => {
    expect(zodReleaseDescriptor.safeParse(descriptor).success).toBe(false);
  });
});

describe('toReleaseSummary', () => {
  it('extracts identity plus exact appVersion, buildId, and buildDate from a validated descriptor', () => {
    const parsed = zodReleaseDescriptor.parse(validReleaseDescriptor);
    const summary = toReleaseSummary(parsed);
    expect(summary).toEqual({
      releaseNumber: parsed.releaseNumber,
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

const releaseSummaryA = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-a',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const releaseSummaryB = {
  releaseNumber: 2,
  appVersion: '1.1.0',
  buildId: 'build-b',
  buildDate: '2026-07-24T00:00:00.000Z',
};

const validControllerState = {
  schemaVersion: 1,
  mode: 'manual',
  activeRelease: releaseSummaryA,
};

describe('zodUpdateControllerState', () => {
  it('accepts the minimal valid state (no optional fields)', () => {
    expect(zodUpdateControllerState.safeParse(validControllerState).success).toBe(true);
  });

  it('accepts every candidate phase', () => {
    for (const candidate of [
      { phase: 'available', release: releaseSummaryB },
      { phase: 'ready', release: releaseSummaryB },
      { phase: 'activating', release: releaseSummaryB, deadlineAt: '2026-07-24T00:00:30.000Z' },
      { phase: 'failed', release: releaseSummaryB },
    ]) {
      expect(
        zodUpdateControllerState.safeParse({ ...validControllerState, candidate }).success,
      ).toBe(true);
    }
  });

  it('accepts lastSuccessfulCheckAt alone, with no candidate', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
      }).success,
    ).toBe(true);
  });

  it('rejects a candidate release missing display metadata (bare identity is no longer a valid summary)', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'available', release: { releaseNumber: 2 } },
      }).success,
    ).toBe(false);
  });

  it('rejects an activating candidate without a deadlineAt', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'activating', release: releaseSummaryB },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown candidate phase', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'pending', release: releaseSummaryB },
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

  it('rejects a non-positive-safe-integer releaseNumber', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: { ...releaseSummaryA, releaseNumber: 0 },
      }).success,
    ).toBe(false);
  });

  it('rejects a candidate not strictly newer than activeRelease', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: releaseSummaryB,
        candidate: { phase: 'available', release: releaseSummaryA },
      }).success,
    ).toBe(false);
  });

  it('rejects a candidate with the same releaseNumber as activeRelease', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'available', release: releaseSummaryA },
      }).success,
    ).toBe(false);
  });
});

describe('zodUpdateControllerState — persisted strictness', () => {
  it('rejects an unknown field on the root object rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        approvedRelease: releaseSummaryB,
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown legacy field on activeRelease rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        activeRelease: { ...releaseSummaryA, legacyReleaseId: 'old-id' },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown field directly on the candidate rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'ready', release: releaseSummaryB, approvedBy: 'admin' },
      }).success,
    ).toBe(false);
  });

  it('rejects an unknown legacy sequence field on the candidate release rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: { phase: 'available', release: { ...releaseSummaryB, sequence: 2 } },
      }).success,
    ).toBe(false);
  });

  it('rejects deadlineAt on an available candidate rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: {
          phase: 'available',
          release: releaseSummaryB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects deadlineAt on a ready candidate rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: {
          phase: 'ready',
          release: releaseSummaryB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects deadlineAt on a failed candidate rather than stripping it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: {
          phase: 'failed',
          release: releaseSummaryB,
          deadlineAt: '2026-07-24T00:00:30.000Z',
        },
      }).success,
    ).toBe(false);
  });

  it('rejects a legacy UUID-shaped reference field on the candidate rather than migrating it', () => {
    expect(
      zodUpdateControllerState.safeParse({
        ...validControllerState,
        candidate: {
          phase: 'available',
          release: releaseSummaryB,
          id: '550e8400-e29b-41d4-a716-446655440000',
        },
      }).success,
    ).toBe(false);
  });
});
