import { describe, expect, it } from 'vitest';
import { resolveInstructionPolicyMode } from './verifyEntry.mjs';

describe('verify entry instruction policy mode', () => {
  it('uses check mode for read-only verification', () => {
    expect(resolveInstructionPolicyMode([])).toBe('--check');
    expect(resolveInstructionPolicyMode(['--only', 'unit-tests'])).toBe('--check');
    expect(resolveInstructionPolicyMode(['--full'])).toBe('--check');
  });

  it('uses fix mode for verify fix modes', () => {
    expect(resolveInstructionPolicyMode(['--fix'])).toBe('--fix');
    expect(resolveInstructionPolicyMode(['--fix-only'])).toBe('--fix');
    expect(resolveInstructionPolicyMode(['--full', '--fix'])).toBe('--fix');
  });
});
