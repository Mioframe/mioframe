import { describe, expect, it } from 'vitest';

import {
  formatVerifyInvocationCommand,
  isResolvedVerifyInvocation,
  isVerificationType,
  resolveVerifyInvocation,
  VERIFICATION_TYPES,
} from './verifyInvocation.ts';

describe('VERIFICATION_TYPES', () => {
  it('contains exactly the eight canonical verification types', () => {
    expect(VERIFICATION_TYPES).toEqual([
      'static',
      'unit',
      'behavior',
      'visual',
      'browser-integration',
      'performance',
      'mutation',
      'e2e',
    ]);
  });

  it('has no duplicate entries', () => {
    expect(new Set(VERIFICATION_TYPES).size).toBe(VERIFICATION_TYPES.length);
  });
});

describe('isVerificationType', () => {
  it('accepts every canonical verification type', () => {
    for (const type of VERIFICATION_TYPES) {
      expect(isVerificationType(type)).toBe(true);
    }
  });

  it('rejects a legacy low-level label', () => {
    expect(isVerificationType('artifact')).toBe(false);
    expect(isVerificationType('managed-updates')).toBe(false);
    expect(isVerificationType('eslint')).toBe(false);
    expect(isVerificationType('unit-tests')).toBe(false);
    expect(isVerificationType('storybook-behavior')).toBe(false);
    expect(isVerificationType('storybook-build')).toBe(false);
  });

  it('rejects a would-be ninth type such as release or setup', () => {
    expect(isVerificationType('release')).toBe(false);
    expect(isVerificationType('setup')).toBe(false);
    expect(isVerificationType('prerequisite')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isVerificationType(null)).toBe(false);
    expect(isVerificationType(undefined)).toBe(false);
    expect(isVerificationType(42)).toBe(false);
  });
});

describe('resolveVerifyInvocation', () => {
  it('makes GitHub base and profile explicit in one structured invocation', () => {
    expect(
      resolveVerifyInvocation(['--only', 'unit'], {
        GITHUB_ACTIONS: 'true',
        GITHUB_BASE_REF: 'develop',
      }),
    ).toEqual({
      version: 5,
      scope: { kind: 'github-base', baseRef: 'origin/develop' },
      profile: 'github-actions',
      onlyType: 'unit',
      verbose: false,
      fixMode: 'none',
      repeat: null,
    });
  });

  it('uses VERIFY_BASE for a local invocation', () => {
    expect(
      resolveVerifyInvocation([], { GITHUB_ACTIONS: 'false', VERIFY_BASE: 'origin/parent' }).scope,
    ).toEqual({ kind: 'local-base', baseRef: 'origin/parent' });
  });

  it('treats explicit files as the effective focused scope and drops an ignored base', () => {
    const invocation = resolveVerifyInvocation(
      ['--base', 'origin/wrong', '--files', 'src/path with space.ts', '--only', 'static'],
      { GITHUB_ACTIONS: 'true', GITHUB_BASE_REF: 'develop' },
    );

    expect(invocation.scope).toEqual({
      kind: 'explicit-files',
      files: ['src/path with space.ts'],
    });
    expect(formatVerifyInvocationCommand(invocation)).toBe(
      "pnpm verify --files 'src/path with space.ts' --profile github-actions --only static",
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
      version: 5,
      scope: { kind: 'full' },
      profile: 'github-actions',
      onlyType: null,
      verbose: false,
      fixMode: 'none',
      repeat: null,
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

  it('rejects --only with --full for every canonical type', () => {
    for (const type of VERIFICATION_TYPES) {
      expect(() => resolveVerifyInvocation(['--full', '--only', type], {})).toThrow(
        '--full cannot be combined with --only.',
      );
    }
  });

  it('rejects --fix-only with --full', () => {
    expect(() => resolveVerifyInvocation(['--full', '--fix-only'], {})).toThrow(
      '--full cannot be combined with --fix-only.',
    );
  });

  it('rejects --repeat with --full', () => {
    expect(() => resolveVerifyInvocation(['--full', '--repeat', '10'], {})).toThrow(
      '--repeat cannot be combined with --full.',
    );
  });

  it('allows --fix with --full', () => {
    expect(resolveVerifyInvocation(['--full', '--fix'], {}).fixMode).toBe('fix');
  });

  it('rejects a legacy low-level label through --only', () => {
    for (const legacyLabel of [
      'eslint',
      'unit-tests',
      'storybook-behavior',
      'storybook-build',
      'artifact',
      'managed-updates',
      'release',
    ]) {
      expect(() => resolveVerifyInvocation(['--only', legacyLabel], {})).toThrow(
        `Invalid value for --only: ${legacyLabel}`,
      );
    }
  });

  it('accepts every canonical verification type through --only', () => {
    for (const type of VERIFICATION_TYPES) {
      expect(resolveVerifyInvocation(['--only', type], {}).onlyType).toBe(type);
    }
  });

  it('accepts --only mutation outside --full, unlike the legacy full-forbidden rule', () => {
    expect(resolveVerifyInvocation(['--only', 'mutation'], {}).onlyType).toBe('mutation');
  });

  it('limits fix mode narrowing to --only static', () => {
    expect(resolveVerifyInvocation(['--fix-only', '--only', 'static'], {}).onlyType).toBe('static');
    expect(resolveVerifyInvocation(['--fix', '--only', 'static'], {}).onlyType).toBe('static');
    expect(() => resolveVerifyInvocation(['--fix-only', '--only', 'unit'], {})).toThrow(
      'Fix modes are supported only with --only static.',
    );
    expect(() => resolveVerifyInvocation(['--fix', '--only', 'e2e'], {})).toThrow(
      'Fix modes are supported only with --only static.',
    );
  });

  it('rejects mutually exclusive fix modes', () => {
    expect(() => resolveVerifyInvocation(['--fix', '--fix-only'], {})).toThrow(
      'Use either --fix or --fix-only, not both.',
    );
  });

  it('rejects the removed --storybook-build-ci-fallback flag as an unknown argument', () => {
    expect(() => resolveVerifyInvocation(['--storybook-build-ci-fallback'], {})).toThrow(
      'Unknown verify argument: --storybook-build-ci-fallback',
    );
  });

  it('resolves --repeat 10 to repeat: 10 with --only behavior and --files', () => {
    expect(
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '10'],
        {},
      ).repeat,
    ).toBe(10);
  });

  it('resolves repeat to null for an ordinary invocation', () => {
    expect(resolveVerifyInvocation([], {}).repeat).toBeNull();
    expect(resolveVerifyInvocation(['--only', 'behavior'], {}).repeat).toBeNull();
  });

  it('rejects a missing value for --repeat', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat'],
        {},
      ),
    ).toThrow('Missing value for --repeat');
  });

  it('rejects a non-integer --repeat value', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '10.5'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: 10.5');
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', 'abc'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: abc');
  });

  it('rejects --repeat values of zero or one', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '0'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: 0');
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '1'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: 1');
  });

  it('rejects a negative --repeat value', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '-1'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: -1');
  });

  it('rejects a --repeat value above the bound of 20', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '21'],
        {},
      ),
    ).toThrow('Invalid value for --repeat: 21');
  });

  it('rejects a duplicate --repeat flag', () => {
    expect(() =>
      resolveVerifyInvocation(
        [
          '--only',
          'behavior',
          '--files',
          'src/foo.behavior.spec.ts',
          '--repeat',
          '10',
          '--repeat',
          '5',
        ],
        {},
      ),
    ).toThrow('Duplicate verify option: --repeat');
  });

  it('rejects --repeat without --only behavior', () => {
    expect(() =>
      resolveVerifyInvocation(['--files', 'src/foo.behavior.spec.ts', '--repeat', '10'], {}),
    ).toThrow('--repeat requires --only behavior');
  });

  it('rejects --repeat with another --only type', () => {
    expect(() =>
      resolveVerifyInvocation(
        ['--only', 'visual', '--files', 'src/foo.behavior.spec.ts', '--repeat', '10'],
        {},
      ),
    ).toThrow('--repeat requires --only behavior');
  });

  it('rejects --repeat without --files', () => {
    expect(() => resolveVerifyInvocation(['--only', 'behavior', '--repeat', '10'], {})).toThrow(
      '--repeat requires --files',
    );
  });
});

describe('formatVerifyInvocationCommand', () => {
  it('renders a read-only rerun with an overridden type and profile', () => {
    const invocation = resolveVerifyInvocation(
      ['--fix-only', '--verbose', '--profile', 'local', '--only', 'static'],
      {},
    );

    expect(
      formatVerifyInvocationCommand(invocation, {
        readOnly: true,
        onlyType: 'e2e',
        profile: 'github-actions',
      }),
    ).toBe('pnpm verify --verbose --profile github-actions --only e2e');
  });

  it('renders a read-only full rerun without a --only override', () => {
    const invocation = resolveVerifyInvocation(['--verbose', '--full'], {});

    expect(formatVerifyInvocationCommand(invocation, { readOnly: true })).toBe(
      'pnpm verify --verbose --full --profile local',
    );
  });

  it('rejects an override that is invalid for the resolved mode', () => {
    const invocation = resolveVerifyInvocation(['--full'], {});

    expect(() => formatVerifyInvocationCommand(invocation, { onlyType: 'mutation' })).toThrow(
      '--full cannot be combined with --only.',
    );
  });

  it('preserves --repeat 10 in the rendered command, including a read-only rerun', () => {
    const invocation = resolveVerifyInvocation(
      ['--only', 'behavior', '--files', 'src/foo.behavior.spec.ts', '--repeat', '10'],
      {},
    );
    const command = formatVerifyInvocationCommand(invocation);

    expect(command.startsWith('pnpm verify')).toBe(true);
    expect(command).toBe(
      'pnpm verify --files src/foo.behavior.spec.ts --profile local --only behavior --repeat 10',
    );

    const rerunCommand = formatVerifyInvocationCommand(invocation, { readOnly: true });

    expect(rerunCommand).toContain('--repeat 10');
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
    expect(isResolvedVerifyInvocation({ version: 5, scope: { kind: 'local' } })).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 4,
        scope: { kind: 'local' },
        profile: 'local',
        onlyLabel: null,
        verbose: false,
        fixMode: 'none',
        storybookBuildCiFallback: false,
        repeat: null,
      }),
    ).toBe(false);
  });

  it('rejects a stale version-4 shape even when it otherwise carries an onlyType field', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 4,
        scope: { kind: 'local' },
        profile: 'local',
        onlyType: null,
        verbose: false,
        fixMode: 'none',
        repeat: null,
      }),
    ).toBe(false);
  });

  it('rejects persisted invalid mode and type combinations', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'full' },
        profile: 'local',
        onlyType: 'mutation',
        verbose: false,
        fixMode: 'none',
        repeat: null,
      }),
    ).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'local' },
        profile: 'local',
        onlyType: 'unit',
        verbose: false,
        fixMode: 'fix-only',
        repeat: null,
      }),
    ).toBe(false);
  });

  it('rejects a legacy low-level label as onlyType', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'local' },
        profile: 'local',
        onlyType: 'eslint',
        verbose: false,
        fixMode: 'none',
        repeat: null,
      }),
    ).toBe(false);
  });

  it('rejects a missing or mistyped repeat field', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'explicit-files', files: ['src/foo.behavior.spec.ts'] },
        profile: 'local',
        onlyType: 'behavior',
        verbose: false,
        fixMode: 'none',
      }),
    ).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'explicit-files', files: ['src/foo.behavior.spec.ts'] },
        profile: 'local',
        onlyType: 'behavior',
        verbose: false,
        fixMode: 'none',
        repeat: '10',
      }),
    ).toBe(false);
  });

  it('rejects a persisted repeat that requires --only behavior and --files', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'local' },
        profile: 'local',
        onlyType: 'visual',
        verbose: false,
        fixMode: 'none',
        repeat: 10,
      }),
    ).toBe(false);
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'local' },
        profile: 'local',
        onlyType: 'behavior',
        verbose: false,
        fixMode: 'none',
        repeat: 10,
      }),
    ).toBe(false);
  });

  it('rejects a persisted repeat outside the bound of 2-20', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'explicit-files', files: ['src/foo.behavior.spec.ts'] },
        profile: 'local',
        onlyType: 'behavior',
        verbose: false,
        fixMode: 'none',
        repeat: 21,
      }),
    ).toBe(false);
  });

  it('accepts a persisted repeat with --only behavior and --files', () => {
    expect(
      isResolvedVerifyInvocation({
        version: 5,
        scope: { kind: 'explicit-files', files: ['src/foo.behavior.spec.ts'] },
        profile: 'local',
        onlyType: 'behavior',
        verbose: false,
        fixMode: 'none',
        repeat: 10,
      }),
    ).toBe(true);
  });

  it('accepts a valid current-version invocation for every canonical type', () => {
    for (const type of VERIFICATION_TYPES) {
      expect(
        isResolvedVerifyInvocation({
          version: 5,
          scope: { kind: 'local' },
          profile: 'local',
          onlyType: type,
          verbose: false,
          fixMode: 'none',
          repeat: null,
        }),
      ).toBe(true);
    }
  });
});
