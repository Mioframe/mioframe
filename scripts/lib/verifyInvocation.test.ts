import { describe, expect, it } from 'vitest';

import {
  formatVerifyInvocationCommand,
  isResolvedVerifyInvocation,
  resolveVerifyInvocation,
} from './verifyInvocation.ts';

describe('resolveVerifyInvocation', () => {
  it('makes GitHub base and profile explicit in one structured invocation', () => {
    expect(
      resolveVerifyInvocation(['--only', 'unit-tests'], {
        GITHUB_ACTIONS: 'true',
        GITHUB_BASE_REF: 'develop',
      }),
    ).toEqual({
      version: 3,
      scope: { kind: 'github-base', baseRef: 'origin/develop' },
      profile: 'github-actions',
      onlyLabel: 'unit-tests',
      verbose: false,
      fixMode: 'none',
      storybookBuildCiFallback: false,
    });
  });

  it('uses VERIFY_BASE for a local invocation', () => {
    expect(
      resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false', VERIFY_BASE: 'origin/parent' }).scope,
    ).toEqual({ kind: 'local-base', baseRef: 'origin/parent' });
  });

  it('treats explicit files as the effective focused scope and drops an ignored base', () => {
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

  it('resolves full mode to an unconditional scope and ignores environment bases', () => {
    expect(
      resolveVerifyInvocation(['--full'], {
        GITHUB_ACTIONS: 'true',
        GITHUB_BASE_REF: 'develop',
        VERIFY_BASE: 'origin/other',
      }),
    ).toEqual({
      version: 3,
      scope: { kind: 'full' },
      profile: 'github-actions',
      onlyLabel: null,
      verbose: false,
      fixMode: 'none',
      storybookBuildCiFallback: false,
    });
  });

  it('rejects explicit changed-path scope in full mode', () => {
    expect(() => resolveVerifyInvocation(['--full', '--base', 'origin/develop'], {})).toThrow(
      '--full cannot be combined with --base',
    );
    expect(() => resolveVerifyInvocation(['--full', '--files', 'src/foo.ts'], {})).toThrow(
      '--full cannot be combined with --files',
    );
  });

  it('requires full mode for release-only labels', () => {
    expect(() => resolveVerifyInvocation(['--only', 'artifact'], {})).toThrow(
      '--only artifact requires --full',
    );
    expect(resolveVerifyInvocation(['--full', '--only', 'artifact'], {}).onlyLabel).toBe(
      'artifact',
    );
  });

  it('accepts storybook-build as a focused label without requiring --full', () => {
    expect(resolveVerifyInvocation(['--only', 'storybook-build'], {}).onlyLabel).toBe(
      'storybook-build',
    );
  });

  it('accepts storybook-build alongside --full, unlike release-only labels', () => {
    expect(resolveVerifyInvocation(['--full', '--only', 'storybook-build'], {}).onlyLabel).toBe(
      'storybook-build',
    );
  });

  it('rejects mutation in full mode', () => {
    expect(() => resolveVerifyInvocation(['--full', '--only', 'mutation'], {})).toThrow(
      '--only mutation is not available with --full',
    );
  });

  it('limits fix-only labels to checks that actually run in fix-only mode', () => {
    expect(resolveVerifyInvocation(['--fix-only', '--only', 'eslint'], {}).onlyLabel).toBe(
      'eslint',
    );
    expect(() => resolveVerifyInvocation(['--fix-only', '--only', 'type-check'], {})).toThrow(
      'Accepted fix-only labels',
    );
    expect(() => resolveVerifyInvocation(['--fix-only', '--only', 'e2e'], {})).toThrow(
      'Accepted fix-only labels',
    );
  });

  it('rejects mutually exclusive fix modes', () => {
    expect(() => resolveVerifyInvocation(['--fix', '--fix-only'], {})).toThrow(
      'Use either --fix or --fix-only, not both.',
    );
  });

  it('resolves --storybook-build-ci-fallback to true with --only storybook-build', () => {
    expect(
      resolveVerifyInvocation(['--only', 'storybook-build', '--storybook-build-ci-fallback'], {})
        .storybookBuildCiFallback,
    ).toBe(true);
  });

  it('resolves storybookBuildCiFallback to false for an ordinary invocation', () => {
    expect(
      resolveVerifyInvocation(['--only', 'storybook-build'], {}).storybookBuildCiFallback,
    ).toBe(false);
    expect(resolveVerifyInvocation([], {}).storybookBuildCiFallback).toBe(false);
  });

  it('rejects --storybook-build-ci-fallback without --only storybook-build', () => {
    expect(() => resolveVerifyInvocation(['--storybook-build-ci-fallback'], {})).toThrow(
      '--storybook-build-ci-fallback requires --only storybook-build',
    );
  });

  it('rejects --storybook-build-ci-fallback with another --only label', () => {
    expect(() =>
      resolveVerifyInvocation(['--only', 'visual', '--storybook-build-ci-fallback'], {}),
    ).toThrow('--storybook-build-ci-fallback requires --only storybook-build');
  });

  it('rejects --storybook-build-ci-fallback with --full', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--full', '--only', 'storybook-build', '--storybook-build-ci-fallback'],
        {},
      ),
    ).toThrow('cannot be combined with --full');
  });

  it('rejects a duplicate --storybook-build-ci-fallback flag', () => {
    expect(() =>
      resolveVerifyInvocation(
        [
          '--only',
          'storybook-build',
          '--storybook-build-ci-fallback',
          '--storybook-build-ci-fallback',
        ],
        {},
      ),
    ).toThrow('Duplicate verify option: --storybook-build-ci-fallback');
  });
});

describe('formatVerifyInvocationCommand', () => {
  it('renders a read-only full rerun without changed-path arguments', () => {
    const invocation = resolveVerifyInvocation(
      ['--fix-only', '--verbose', '--full', '--profile', 'local', '--only', 'format'],
      {},
    );

    expect(
      formatVerifyInvocationCommand(invocation, {
        readOnly: true,
        onlyLabel: 'artifact',
        profile: 'github-actions',
      }),
    ).toBe('pnpm verify --verbose --full --profile github-actions --only artifact');
  });

  it('rejects an override that is invalid for the resolved mode', () => {
    const invocation = resolveVerifyInvocation(['--full'], {});

    expect(() => formatVerifyInvocationCommand(invocation, { onlyLabel: 'mutation' })).toThrow(
      '--only mutation is not available with --full',
    );
  });

  it('preserves --storybook-build-ci-fallback in the rendered rerun command', () => {
    const invocation = resolveVerifyInvocation(
      ['--verbose', '--only', 'storybook-build', '--storybook-build-ci-fallback'],
      {},
    );
    const command = formatVerifyInvocationCommand(invocation);

    expect(command.startsWith('pnpm verify')).toBe(true);
    expect(command).toBe(
      'pnpm verify --verbose --profile local --only storybook-build --storybook-build-ci-fallback',
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
  it('rejects corrupted and legacy persisted metadata', () => {
    expect(isResolvedVerifyInvocation({ version: 3, scope: { kind: 'local' } })).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 2,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: null,
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: false,
      }),
    ).toBe(false);
  });

  it('rejects persisted invalid mode and label combinations', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'full' },
        profile: 'local',
        onlyLabel: 'mutation',
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: false,
      }),
    ).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: 'type-check',
        verbose: false,
        fixMode: 'fix-only',
        storybookBuildCiFallback: false,
      }),
    ).toBe(false);
  });

  it('rejects a missing or mistyped storybookBuildCiFallback field', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: null,
        verbose: false,
        fixMode: 'none',
      }),
    ).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: null,
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: 'true',
      }),
    ).toBe(false);
  });

  it('rejects a persisted storybookBuildCiFallback that requires --only storybook-build', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: 'visual',
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: true,
      }),
    ).toBe(false);
  });

  it('accepts a persisted storybookBuildCiFallback with --only storybook-build', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 3,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: 'storybook-build',
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: true,
      }),
    ).toBe(true);
  });
});
