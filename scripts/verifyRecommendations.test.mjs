import { describe, expect, it } from 'vitest';

import { getActionRequired, getVerifyRerunCommand } from './verify.mjs';

describe('getVerifyRerunCommand', () => {
  it('preserves task scope while removing fix mode', () => {
    expect(
      getVerifyRerunCommand([
        '--fix-only',
        '--base',
        'origin/develop',
        '--profile',
        'local',
        '--files',
        'src/foo.ts',
        'src/bar.vue',
      ]),
    ).toBe('pnpm verify --base origin/develop --profile local --files src/foo.ts src/bar.vue');
  });

  it('replaces focused label and profile without dropping full or file scope', () => {
    expect(
      getVerifyRerunCommand(
        [
          '--full',
          '--only=visual',
          '--profile=local',
          '--files',
          'tests/e2e/visual/button.spec.ts',
        ],
        { onlyLabel: 'e2e', profile: 'github-actions' },
      ),
    ).toBe(
      'pnpm verify --full --files tests/e2e/visual/button.spec.ts --profile github-actions --only e2e',
    );
  });

  it('quotes paths that require shell quoting', () => {
    expect(
      getVerifyRerunCommand(['--base', 'origin/develop', '--files', 'src/path with space.ts']),
    ).toBe('pnpm verify --base origin/develop --files "src/path with space.ts"');
  });
});

describe('getActionRequired scoped recommendations', () => {
  const failedResult = {
    label: 'unit-tests',
    command: 'pnpm exec vitest run src/foo.test.ts',
    status: 'failed',
    exitCode: 1,
    hasWarnings: false,
    warningSummary: '',
    blockingLogIssue: null,
  };

  it('recommends verify-managed reruns instead of raw child commands', () => {
    const actions = getActionRequired([failedResult], {
      verifyArgs: ['--base', 'origin/develop', '--fix'],
    });

    expect(actions).toContain(
      'Fix failed unit-tests errors. Rerun through verify: pnpm verify --base origin/develop --only unit-tests',
    );
    expect(actions).toContain(
      'After fixes, rerun the original read-only scope: pnpm verify --base origin/develop',
    );
    expect(actions.join('\n')).not.toContain('pnpm exec vitest');
    expect(actions.join('\n')).not.toContain('--fix');
  });

  it('preserves base and file scope for CI-profile reruns', () => {
    const actions = getActionRequired([], {
      verifyArgs: ['--base', 'origin/develop', '--profile', 'local', '--files', 'src/foo.ts'],
      ciProfileRisk: {
        affectedChecks: ['e2e'],
        activeProfile: { name: 'local' },
      },
    });

    expect(actions).toContain(
      'For CI-equivalent Playwright confidence locally, rerun: pnpm verify --base origin/develop --files src/foo.ts --profile github-actions --only e2e',
    );
  });
});
