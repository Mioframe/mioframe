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
});
