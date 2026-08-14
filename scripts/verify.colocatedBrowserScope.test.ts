import { describe, expect, it } from 'vitest';

import { buildCommands } from './verify.ts';

const loadingIndicatorBrowserSpec =
  'src/shared/ui/material/components/loadingIndicator/MDLoadingIndicator.browser.spec.ts';

describe('buildCommands colocated browser spec routing', () => {
  it('excludes a colocated browser spec from focused unit-tests', () => {
    const commands = buildCommands([loadingIndicatorBrowserSpec], { fullMode: false });
    const entry = commands.find((item) => item.label === 'unit-tests');

    expect(entry?.kind).toBe('skipped');

    if (entry?.kind !== 'skipped') {
      throw new Error('expected unit-tests to be skipped');
    }

    expect(entry.reason).toBe('empty focused unit-test scope');
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

  it('keeps a real Vitest test in unit scope when it changes beside a browser spec', () => {
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
      'run',
      '--reporter=verbose',
      'src/shared/lib/cache/index.test.ts',
    ]);
  });
});
