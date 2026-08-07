import { describe, expect, it } from 'vitest';
import {
  canonicalReleasePathCases,
  invalidReleaseDescriptors,
  validReleaseDescriptor,
} from '../../../../scripts/pages/lib/releaseDescriptorCorpus.mjs';
import {
  isCanonicalReleasePath,
  isPositiveSafeInteger,
  zodReleaseDescriptor,
} from './releaseWireContract';

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

describe('isCanonicalReleasePath', () => {
  it.each(canonicalReleasePathCases)('$name: $path -> $valid', ({ path, valid }) => {
    expect(isCanonicalReleasePath(path)).toBe(valid);
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
