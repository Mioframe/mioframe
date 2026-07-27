import { describe, expect, it } from 'vitest';

import { formatVerifyInvocationCommand, resolveVerifyInvocation } from './verifyInvocation.mjs';

const LOCAL_ENV = { GITHUB_ACTIONS: 'false' };

describe('verify invocation validation', () => {
  it('rejects unknown arguments instead of silently changing scope', () => {
    expect(() => resolveVerifyInvocation(['--ful'], LOCAL_ENV)).toThrow(
      'Unknown verify argument: --ful',
    );
    expect(() => resolveVerifyInvocation(['unexpected-path'], LOCAL_ENV)).toThrow(
      'Unknown verify argument: unexpected-path',
    );
  });

  it('rejects repeated singleton options', () => {
    expect(() =>
      resolveVerifyInvocation(['--base', 'origin/develop', '--base=origin/main'], LOCAL_ENV),
    ).toThrow('Duplicate verify option: --base');
    expect(() => resolveVerifyInvocation(['--full', '--full'], LOCAL_ENV)).toThrow(
      'Duplicate verify option: --full',
    );
    expect(() =>
      resolveVerifyInvocation(['--files', 'src/a.ts', '--files=src/b.ts'], LOCAL_ENV),
    ).toThrow('Duplicate verify option: --files');
  });

  it('rejects combined fix mode for labels that cannot apply fixers', () => {
    expect(() => resolveVerifyInvocation(['--fix', '--only', 'type-check'], LOCAL_ENV)).toThrow(
      '--fix --only type-check is unsupported',
    );
    expect(() => resolveVerifyInvocation(['--fix', '--only', 'e2e'], LOCAL_ENV)).toThrow(
      '--fix --only e2e is unsupported',
    );
  });

  it('keeps fixer labels valid for both fix modes', () => {
    expect(resolveVerifyInvocation(['--fix', '--only', 'eslint'], LOCAL_ENV).fixMode).toBe('fix');
    expect(resolveVerifyInvocation(['--fix-only', '--only', 'format'], LOCAL_ENV).fixMode).toBe(
      'fix-only',
    );
  });

  it('applies the same mode validation when rendering persisted invocations', () => {
    const invocation = resolveVerifyInvocation(['--base', 'origin/develop'], LOCAL_ENV);

    expect(() =>
      formatVerifyInvocationCommand(
        { ...invocation, fixMode: 'fix', onlyLabel: 'type-check' },
        {},
      ),
    ).toThrow('Invalid resolved verify invocation');
  });
});
