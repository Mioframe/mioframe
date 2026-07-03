import { describe, expect, it } from 'vitest';

import { computeBranchSlug } from './computeBranchSlug.mjs';

describe('computeBranchSlug', () => {
  it('prints the slug for a simple branch name', () => {
    expect(computeBranchSlug(['--branch', 'develop'])).toBe('develop');
  });

  it('slugifies a branch name with slashes', () => {
    expect(computeBranchSlug(['--branch', 'feature/My-Thing'])).toBe('feature-my-thing');
  });

  it('throws when --branch is missing', () => {
    expect(() => computeBranchSlug([])).toThrow('Usage:');
  });

  it('throws when the branch name produces a reserved slug', () => {
    expect(() => computeBranchSlug(['--branch', 'pr'])).toThrow('is reserved');
  });
});
