import { describe, expect, it } from 'vitest';

import { computeBranchSlug } from './computeBranchSlug.mjs';

describe('computeBranchSlug', () => {
  it('prints the bare slug for the literal develop branch', () => {
    expect(computeBranchSlug(['--branch', 'develop'])).toBe('develop');
  });

  it('slugifies a branch name with slashes and appends a hash suffix', () => {
    expect(computeBranchSlug(['--branch', 'feature/My-Thing'])).toMatch(
      /^feature-my-thing-[0-9a-f]{8}$/,
    );
  });

  it('throws when --branch is missing', () => {
    expect(() => computeBranchSlug([])).toThrow('Usage:');
  });

  it('produces distinct slugs for branch names that collide after normalization', () => {
    const slugSlash = computeBranchSlug(['--branch', 'feature/a']);
    const slugDash = computeBranchSlug(['--branch', 'feature-a']);
    const slugUnderscore = computeBranchSlug(['--branch', 'feature_a']);

    expect(new Set([slugSlash, slugDash, slugUnderscore]).size).toBe(3);
  });

  it('throws for a branch name that produces an empty normalized prefix', () => {
    expect(() => computeBranchSlug(['--branch', '///'])).toThrow('produces an empty slug');
  });
});
