import { describe, expect, it } from 'vitest';

import { buildCommands } from './verify.ts';

const loadingIndicatorBrowserSpec =
  'src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.browser.spec.ts';

describe('buildCommands colocated browser spec routing', () => {
  it('routes a colocated browser spec to its real scan-owner tests instead of skipping unit-tests, without ever treating the spec itself as Vitest source', () => {
    const commands = buildCommands([loadingIndicatorBrowserSpec], { fullMode: false });
    const entry = commands.find((item) => item.label === 'unit-tests');

    expect(entry?.kind).toBe('run');

    if (entry?.kind !== 'run') {
      throw new Error('expected unit-tests to run');
    }

    expect(entry.args).toEqual([
      'exec',
      'vitest',
      'related',
      'playwright.lanes.test.ts',
      'scripts/lib/storybookBehaviorRisk.test.ts',
      'src/readRecoveryImportBoundary.test.ts',
      '--run',
      '--reporter=verbose',
    ]);
    expect(entry.args).not.toContain(loadingIndicatorBrowserSpec);
  });

  it('routes the same colocated browser spec to focused storybook-behavior', () => {
    const commands = buildCommands([loadingIndicatorBrowserSpec], { fullMode: false });
    const entry = commands.find((item) => item.label === 'storybook-behavior');

    expect(entry?.kind).toBe('run');

    if (entry?.kind !== 'run') {
      throw new Error('expected storybook-behavior to run');
    }

    expect(entry.args).toEqual(['test:storybook-behavior', loadingIndicatorBrowserSpec]);
  });

  it('keeps a real Vitest test in unit scope alongside the browser spec scan-owner set when it changes beside a browser spec', () => {
    const commands = buildCommands(
      [loadingIndicatorBrowserSpec, 'src/shared/lib/cache/index.test.ts'],
      { fullMode: false },
    );
    const entry = commands.find((item) => item.label === 'unit-tests');

    expect(entry?.kind).toBe('run');

    if (entry?.kind !== 'run') {
      throw new Error('expected unit-tests to run');
    }

    expect(entry.args).toEqual([
      'exec',
      'vitest',
      'related',
      'playwright.lanes.test.ts',
      'scripts/lib/storybookBehaviorRisk.test.ts',
      'src/readRecoveryImportBoundary.test.ts',
      'src/shared/lib/cache/index.test.ts',
      'src/shared/ui/material/rendererBoundary.test.ts',
      '--run',
      '--reporter=verbose',
    ]);
    expect(entry.args).not.toContain(loadingIndicatorBrowserSpec);
  });
});
