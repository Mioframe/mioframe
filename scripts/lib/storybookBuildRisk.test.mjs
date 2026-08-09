import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.mjs', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange } from './packageJsonImpact.mjs';
import { isStorybookBuildRelevantFile, resolveStorybookBuildPlan } from './storybookBuildRisk.mjs';

describe('isStorybookBuildRelevantFile', () => {
  it('matches Storybook configuration/runtime infrastructure', () => {
    expect(isStorybookBuildRelevantFile('.storybook/main.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('.storybook/preview.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('.storybook/router/routerHarness.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('scripts/storybook.mjs')).toBe(true);
    expect(isStorybookBuildRelevantFile('tsconfig.storybook.json')).toBe(true);
    expect(isStorybookBuildRelevantFile('config/tooling.json')).toBe(true);
    expect(isStorybookBuildRelevantFile('vite.config.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('pnpm-lock.yaml')).toBe(true);
    expect(isStorybookBuildRelevantFile('config/alias.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('src/app/styles/base.css')).toBe(true);
    expect(isStorybookBuildRelevantFile('tsconfig.src.json')).toBe(true);
  });

  it('matches any changed story file', () => {
    expect(isStorybookBuildRelevantFile('src/shared/ui/Checkbox/MDCheckbox.stories.ts')).toBe(true);
    expect(isStorybookBuildRelevantFile('src/shared/ui/Card/MDCard.stories.vue')).toBe(true);
  });

  it('does not match unrelated source', () => {
    expect(isStorybookBuildRelevantFile('src/app/main.ts')).toBe(false);
    expect(isStorybookBuildRelevantFile('src/shared/ui/Checkbox/MDCheckbox.vue')).toBe(false);
    expect(isStorybookBuildRelevantFile('src/shared/ui/Checkbox/MDCheckbox.test.ts')).toBe(false);
    expect(isStorybookBuildRelevantFile('README.md')).toBe(false);
  });
});

describe('resolveStorybookBuildPlan', () => {
  it('skips for a changed-file set with no storybook-relevant impact', () => {
    const plan = resolveStorybookBuildPlan(['src/app/main.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('selects the full lane for a changed story file', () => {
    const plan = resolveStorybookBuildPlan(['src/shared/ui/Checkbox/MDCheckbox.stories.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons.join(' ')).toContain('Storybook-relevant path');
  });

  it('selects the full lane for a .storybook/ path change', () => {
    const plan = resolveStorybookBuildPlan(['.storybook/preview.ts']);

    expect(plan.mode).toBe('full');
  });

  it('selects the full lane for a direct Storybook-wide dependency change', () => {
    expect(resolveStorybookBuildPlan(['config/alias.ts']).mode).toBe('full');
    expect(resolveStorybookBuildPlan(['src/app/styles/base.css']).mode).toBe('full');
    expect(resolveStorybookBuildPlan(['tsconfig.src.json']).mode).toBe('full');
  });

  it('selects the full lane for a removed/renamed story file without requiring it to exist', () => {
    const plan = resolveStorybookBuildPlan(['src/shared/ui/Removed/Removed.stories.ts']);

    expect(plan.mode).toBe('full');
  });

  describe('package.json impact', () => {
    beforeEach(() => {
      isPackageJsonRuntimeRelevantChange.mockReset();
    });

    it('skips for a confirmed version-only package.json change', () => {
      isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

      const plan = resolveStorybookBuildPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

      expect(plan.mode).toBe('skip');
      expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
    });

    it('selects the full lane when the package.json impact check is runtime-relevant', () => {
      isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

      const plan = resolveStorybookBuildPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

      expect(plan.mode).toBe('full');
      expect(plan.reasons.join(' ')).toContain('runtime-relevant package.json change');
    });

    it('does not consult the package.json impact check when package.json did not change', () => {
      resolveStorybookBuildPlan(['src/app/main.ts']);

      expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
    });
  });
});
