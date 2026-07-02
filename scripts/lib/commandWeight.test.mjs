import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { classifyCommandWeight, resolveEslintConcurrency } from './commandWeight.mjs';

describe('classifyCommandWeight', () => {
  it('keeps small explicit eslint scopes light', () => {
    expect(classifyCommandWeight({ label: 'eslint', fileCount: 2 })).toBe('light');
  });

  it('treats large eslint scopes as expensive', () => {
    expect(classifyCommandWeight({ label: 'eslint', fileCount: 41 })).toBe('expensive');
    expect(classifyCommandWeight({ label: 'eslint', isFullRepo: true })).toBe('expensive');
  });

  it('treats container and mutation flows as expensive', () => {
    expect(classifyCommandWeight({ label: 'visual' })).toBe('expensive');
    expect(classifyCommandWeight({ label: 'mutation' })).toBe('expensive');
  });

  it('treats release artifact and smoke checks as expensive', () => {
    expect(classifyCommandWeight({ label: 'artifact' })).toBe('expensive');
    expect(classifyCommandWeight({ label: 'release-smoke' })).toBe('expensive');
  });

  it('keeps release-version light and build medium', () => {
    expect(classifyCommandWeight({ label: 'release-version' })).toBe('light');
    expect(classifyCommandWeight({ label: 'build' })).toBe('medium');
  });
});

describe('resolveEslintConcurrency', () => {
  const envSnapshot = { ...process.env };

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    process.env = { ...envSnapshot };
  });

  it('uses explicit env override first', () => {
    vi.stubEnv('MIOFRAME_ESLINT_CONCURRENCY', '7');
    expect(resolveEslintConcurrency()).toBe('7');
  });

  it('disables local eslint worker concurrency by default', () => {
    delete process.env.MIOFRAME_ESLINT_CONCURRENCY;
    delete process.env.ESLINT_CONCURRENCY;
    delete process.env.CI;
    delete process.env.GITHUB_ACTIONS;

    expect(resolveEslintConcurrency()).toBe('off');
  });
});
