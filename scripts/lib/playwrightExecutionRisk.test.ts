import { describe, expect, it } from 'vitest';

import { isSharedPlaywrightExecutionInfrastructurePath } from './playwrightExecutionRisk.ts';

describe('isSharedPlaywrightExecutionInfrastructurePath', () => {
  it.each([
    'config/tooling.json',
    'pnpm-lock.yaml',
    'scripts/playwrightContainer.ts',
    'scripts/lib/localCommandGuard.ts',
    'scripts/lib/commandLock.ts',
    'scripts/lib/runLocalCommand.ts',
    'scripts/lib/processResult.ts',
    'scripts/lib/signalForward.ts',
  ])('classifies %s as shared Playwright execution infrastructure', (filePath) => {
    expect(isSharedPlaywrightExecutionInfrastructurePath(filePath)).toBe(true);
  });

  it('does not classify an unrelated path as shared Playwright execution infrastructure', () => {
    expect(
      isSharedPlaywrightExecutionInfrastructurePath('src/features/documentCreate/index.ts'),
    ).toBe(false);
  });

  it('does not classify package.json as shared Playwright execution infrastructure', () => {
    expect(isSharedPlaywrightExecutionInfrastructurePath('package.json')).toBe(false);
  });

  it('does not classify a type-specific Playwright config as shared execution infrastructure', () => {
    expect(isSharedPlaywrightExecutionInfrastructurePath('playwright.storybook.config.ts')).toBe(
      false,
    );
    expect(isSharedPlaywrightExecutionInfrastructurePath('playwright.visual.config.ts')).toBe(
      false,
    );
    expect(
      isSharedPlaywrightExecutionInfrastructurePath('playwright.browserIntegration.config.ts'),
    ).toBe(false);
    expect(isSharedPlaywrightExecutionInfrastructurePath('playwright.config.ts')).toBe(false);
  });
});
