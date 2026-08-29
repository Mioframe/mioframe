import { describe, expect, it } from 'vitest';

import { isSharedLocalCommandExecutionPath } from './localCommandExecutionRisk.ts';

describe('isSharedLocalCommandExecutionPath', () => {
  it.each([
    'scripts/lib/localCommandGuard.ts',
    'scripts/lib/commandLock.ts',
    'scripts/lib/runLocalCommand.ts',
    'scripts/lib/processResult.ts',
    'scripts/lib/signalForward.ts',
  ])('classifies %s as shared local-command execution infrastructure', (filePath) => {
    expect(isSharedLocalCommandExecutionPath(filePath)).toBe(true);
  });

  it('does not classify an unrelated path as shared local-command execution infrastructure', () => {
    expect(isSharedLocalCommandExecutionPath('src/features/documentCreate/index.ts')).toBe(false);
  });

  it('does not classify package.json as shared local-command execution infrastructure', () => {
    expect(isSharedLocalCommandExecutionPath('package.json')).toBe(false);
  });

  it('does not classify Playwright-specific infrastructure as shared local-command execution', () => {
    expect(isSharedLocalCommandExecutionPath('scripts/playwrightContainer.ts')).toBe(false);
    expect(isSharedLocalCommandExecutionPath('config/tooling.json')).toBe(false);
    expect(isSharedLocalCommandExecutionPath('pnpm-lock.yaml')).toBe(false);
  });
});
