import { describe, expect, it } from 'vitest';

import {
  formatVerifyInvocationCommand,
  isResolvedVerifyInvocation,
  resolveVerifyInvocation,
} from './verifyInvocation.mjs';

describe('resolveVerifyInvocation', () => {
  it('makes GitHub base and profile explicit in one structured invocation', () => {
    expect(
      resolveVerifyInvocation(['--only', 'unit-tests'], {
        GITHUB_ACTIONS: 'true',
        GITHUB_BASE_REF: 'develop',
      }),
    ).toEqual({
      version: 1,
      scope: { kind: 'github-base', baseRef: 'origin/develop' },
      profile: 'github-actions',
      onlyLabel: 'unit-tests',
      full: false,
      verbose: false,
      fixMode: 'none',
    });
  });

  it('uses VERIFY_BASE for a local invocation', () => {
    expect(
      resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false', VERIFY_BASE: 'origin/parent' }).scope,
    ).toEqual({ kind: 'local-base', baseRef: 'origin/parent' });
  });

  it('treats explicit files as the effective scope and does not retain an ignored base', () => {
    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/wrong', '--files', 'src/path with space.ts', '--only', 'eslint'],
      { GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'develop' },
    );

    expect(invocation.scope).toEqual({
      kind: 'explicit-files',
      files: ['src/path with space.ts'],
    });
    expect(formatVerifyInvocationCommand(invocation)).toBe(
      "pnpm verify --files 'src/path with space.ts' --profile github-actions --only eslint",
    );
  });

  it('rejects a release-only label without full mode', () => {
    expect(() => resolveVerifyInvocation(['--only', 'artifact'], {})).toThrow(
      '--only artifact requires --full',
    );
  });

  it('accepts a release-only label in full mode', () => {
    expect(resolveVerifyInvocation(['--full', '--only', 'artifact'], {}).onlyLabel).toBe(
      'artifact',
    );
  });

  it('rejects mutually exclusive fix modes', () => {
    expect(() => resolveVerifyInvocation(['--fix', '--fix-only'], {})).toThrow(
      'Use either --fix or --fix-only, not both.',
    );
  });
});

describe('formatVerifyInvocationCommand', () => {
  it('preserves full, verbose, files, profile, and label while removing fix mode for reruns', () => {
    const invocation = resolveVerifyInvocation(
      [
        '--fix-only',
        '--verbose',
        '--full',
        '--profile',
        'local',
        '--only',
        'visual',
        '--files',
        'tests/e2e/visual/path with space.spec.ts',
      ],
      {},
    );

    expect(
      formatVerifyInvocationCommand(invocation, {
        readOnly: true,
        onlyLabel: 'artifact',
        profile: 'github-actions',
      }),
    ).toBe(
      "pnpm verify --verbose --full --files 'tests/e2e/visual/path with space.spec.ts' --profile github-actions --only artifact",
    );
  });

  it('single-quotes substitutions, backticks, and embedded single quotes', () => {
    const backtick = String.fromCharCode(96);
    const unsafePath =
      'src/$(touch unsafe) ' + backtick + 'echo unsafe' + backtick + " and 'quote.ts";
    const invocation = resolveVerifyInvocation(['--files', unsafePath], {});
    const command = formatVerifyInvocationCommand(invocation);

    expect(command).toContain("--files 'src/$(touch unsafe)");
    expect(command).toContain(backtick);
    expect(command).toContain("'\\''");
  });
});

describe('isResolvedVerifyInvocation', () => {
  it('rejects corrupted persisted metadata', () => {
    expect(isResolvedVerifyInvocation({ version: 1, scope: { kind: 'local' } })).toBe(false);
  });

  it('rejects a persisted release-only label without full mode', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 1,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: 'artifact',
        full: false,
        verbose: false,
        fixMode: 'none',
      }),
    ).toBe(false);
  });
});
