import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isPackageJsonRuntimeRelevantChange: vi.fn(),
}));

import { isPackageJsonRuntimeRelevantChange as isPackageJsonRuntimeRelevantChangeImport } from './packageJsonImpact.ts';
import {
  findColocatedBehaviorSpecFiles,
  isColocatedBehaviorSpecPath,
  isFullStorybookBehaviorLanePath,
  resolveStorybookBehaviorPlan,
} from './storybookBehaviorRisk.ts';

const isPackageJsonRuntimeRelevantChange = vi.mocked(isPackageJsonRuntimeRelevantChangeImport);

const LOADING_INDICATOR_OWNER_DIR = 'src/shared/ui/material/components/loadingIndicator';
const LOADING_INDICATOR_BEHAVIOR_SPEC = `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.behavior.spec.ts`;

describe('isColocatedBehaviorSpecPath', () => {
  it('flags owner-local behavior specs under src/', () => {
    expect(isColocatedBehaviorSpecPath(LOADING_INDICATOR_BEHAVIOR_SPEC)).toBe(true);
  });

  it('does not flag non-behavior src files or paths outside src/', () => {
    expect(
      isColocatedBehaviorSpecPath(`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`),
    ).toBe(false);
    expect(
      isColocatedBehaviorSpecPath(
        `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.visual.spec.ts`,
      ),
    ).toBe(false);
    expect(isColocatedBehaviorSpecPath('.storybook/router/routerHarness.behavior.spec.ts')).toBe(
      false,
    );
  });
});

describe('findColocatedBehaviorSpecFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'colocated-behavior-spec-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recursively discovers nested *.behavior.spec.ts files and ignores other files', () => {
    fs.mkdirSync(path.join(tmpDir, 'owner'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.behavior.spec.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.vue'), '');
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.visual.spec.ts'), '');

    expect(findColocatedBehaviorSpecFiles(tmpDir)).toEqual([
      path.posix.join(tmpDir, 'owner/Owner.behavior.spec.ts'),
    ]);
  });

  it('discovers the real colocated Loading Indicator behavior spec under src/', () => {
    expect(findColocatedBehaviorSpecFiles()).toContain(LOADING_INDICATOR_BEHAVIOR_SPEC);
  });
});

describe('isFullStorybookBehaviorLanePath', () => {
  it('flags the behavior Playwright config and shared runner infrastructure', () => {
    expect(isFullStorybookBehaviorLanePath('playwright.storybook.config.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/playwrightContainer.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/storybookBehavior.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/storybook.mjs')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/storybookBehaviorRisk.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('config/tooling.json')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('tsconfig.storybook.json')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/verify.ts')).toBe(true);
  });

  it('flags the shared Playwright command/lock/result/signal execution infrastructure', () => {
    expect(isFullStorybookBehaviorLanePath('scripts/lib/localCommandGuard.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/commandLock.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/runLocalCommand.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/processResult.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('scripts/lib/signalForward.ts')).toBe(true);
  });

  it('flags the remaining cross-owner Storybook test helper', () => {
    expect(isFullStorybookBehaviorLanePath('tests/e2e/storybook/storybook.testUtils.ts')).toBe(
      true,
    );
  });

  it('flags the visual lane openStory helper reused by FabContainer/MDMenu behavior proof', () => {
    expect(isFullStorybookBehaviorLanePath('tests/e2e/visual/storybook.ts')).toBe(true);
  });

  it('flags any path under .storybook/, including its own colocated behavior spec', () => {
    expect(isFullStorybookBehaviorLanePath('.storybook/main.ts')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('.storybook/vite.preview.config.ts')).toBe(true);
    expect(
      isFullStorybookBehaviorLanePath('.storybook/router/routerHarness.behavior.spec.ts'),
    ).toBe(true);
  });

  it('does not flag unrelated source paths', () => {
    expect(isFullStorybookBehaviorLanePath('src/features/documentCreate/index.ts')).toBe(false);
  });

  it('flags every production-owned Storybook preview style dependency', () => {
    expect(isFullStorybookBehaviorLanePath('src/app/styles/base.css')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('src/app/styles/fonts.css')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('src/shared/ui/material/foundation/index.css')).toBe(
      true,
    );
    expect(isFullStorybookBehaviorLanePath('src/shared/ui/material/foundation/tokens.css')).toBe(
      true,
    );
    expect(isFullStorybookBehaviorLanePath('src/shared/ui/material/foundation/theme.css')).toBe(
      true,
    );
    expect(isFullStorybookBehaviorLanePath('src/shared/lib/md/index.css')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('src/shared/lib/md/typography.css')).toBe(true);
    expect(isFullStorybookBehaviorLanePath('src/shared/lib/md/space.css')).toBe(true);
  });

  it('does not flag the application-shell stylesheet or unrelated non-preview files', () => {
    expect(isFullStorybookBehaviorLanePath('src/app/styles/styles.css')).toBe(false);
    expect(isFullStorybookBehaviorLanePath('src/shared/lib/md/index.test.ts')).toBe(false);
  });
});

describe('resolveStorybookBehaviorPlan', () => {
  it('runs the full lane for the behavior Playwright config', () => {
    const plan = resolveStorybookBehaviorPlan(['playwright.storybook.config.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path');
  });

  it('runs the full lane for the Storybook preview style entrypoint', () => {
    const plan = resolveStorybookBehaviorPlan(['src/app/styles/base.css']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path');
  });

  it('does not run the full lane for the application-shell stylesheet', () => {
    const plan = resolveStorybookBehaviorPlan(['src/app/styles/styles.css']);

    expect(plan.mode).toBe('none');
  });

  it('runs the full lane for any .storybook/ path change, including its own colocated spec', () => {
    expect(resolveStorybookBehaviorPlan(['.storybook/main.ts']).mode).toBe('full');
    expect(
      resolveStorybookBehaviorPlan(['.storybook/router/routerHarness.behavior.spec.ts']).mode,
    ).toBe('full');
  });

  it('runs the full lane for a change to the remaining cross-owner Storybook test helper', () => {
    const plan = resolveStorybookBehaviorPlan(['tests/e2e/storybook/storybook.testUtils.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path');
  });

  it('does not run the full lane for an arbitrary unrelated src change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/features/documentCreate/index.ts']);

    expect(plan.mode).toBe('none');
  });

  it('runs the full lane for a pnpm-lock.yaml change', () => {
    const plan = resolveStorybookBehaviorPlan(['pnpm-lock.yaml']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path pnpm-lock.yaml');
  });

  it('runs the full lane for a scripts/verify.ts change', () => {
    const plan = resolveStorybookBehaviorPlan(['scripts/verify.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('Storybook/Playwright infrastructure path scripts/verify.ts');
  });

  it('does not run the full lane for an unrelated src/shared/ui change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Chips/MDChipBase.vue']);

    expect(plan.mode).toBe('none');
  });

  it('reports none for an empty changed-file scope', () => {
    const plan = resolveStorybookBehaviorPlan(['README.md']);

    expect(plan.mode).toBe('none');
  });
});

describe('resolveStorybookBehaviorPlan colocated behavior spec ownership', () => {
  it('selects itself when the colocated Loading Indicator behavior spec changes', () => {
    const plan = resolveStorybookBehaviorPlan([LOADING_INDICATOR_BEHAVIOR_SPEC]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_BEHAVIOR_SPEC]);
  });

  it('selects the colocated spec for a Loading Indicator component change', () => {
    const plan = resolveStorybookBehaviorPlan([
      `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`,
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_BEHAVIOR_SPEC]);
  });

  it('selects the colocated spec for a Loading Indicator story change', () => {
    const plan = resolveStorybookBehaviorPlan([
      `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.stories.ts`,
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_BEHAVIOR_SPEC]);
  });

  it('selects the colocated spec for another file under the Loading Indicator owner directory', () => {
    const plan = resolveStorybookBehaviorPlan([`${LOADING_INDICATOR_OWNER_DIR}/tokens.css`]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_BEHAVIOR_SPEC]);
  });

  it('does not select the colocated spec for an unrelated src change', () => {
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Chips/MDChipBase.vue']);

    expect(plan.mode).toBe('none');
  });

  it('runs the full lane for a removed colocated behavior spec', () => {
    const plan = resolveStorybookBehaviorPlan([LOADING_INDICATOR_BEHAVIOR_SPEC], {
      fileExists: () => false,
    });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
    expect(plan.reasons[0]).toContain(
      `removed or renamed colocated behavior spec ${LOADING_INDICATOR_BEHAVIOR_SPEC}`,
    );
  });

  it('runs the full lane for a rename-like input where the old colocated spec no longer exists', () => {
    const oldSpecPath = `${LOADING_INDICATOR_OWNER_DIR}/OldLoadingIndicator.behavior.spec.ts`;
    const plan = resolveStorybookBehaviorPlan([oldSpecPath, LOADING_INDICATOR_BEHAVIOR_SPEC], {
      fileExists: (filePath) => filePath !== oldSpecPath,
    });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
    expect(plan.reasons[0]).toContain(`removed or renamed colocated behavior spec ${oldSpecPath}`);
  });

  it('never returns a missing colocated spec in focused specs', () => {
    const plan = resolveStorybookBehaviorPlan([LOADING_INDICATOR_BEHAVIOR_SPEC], {
      fileExists: () => false,
    });

    expect(plan.specs).not.toContain(LOADING_INDICATOR_BEHAVIOR_SPEC);
  });

  it('resolves colocated ownership from an injected colocatedSpecFiles override rather than only the real filesystem', () => {
    const ownerSpec = 'src/shared/ui/Example/Example.behavior.spec.ts';
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Example/Example.vue'], {
      colocatedSpecFiles: [ownerSpec],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([ownerSpec]);
  });

  it('selects every colocated behavior spec in the same owner directory for an owner-source change', () => {
    const firstSpec = 'src/shared/ui/Example/First.behavior.spec.ts';
    const secondSpec = 'src/shared/ui/Example/Second.behavior.spec.ts';
    const plan = resolveStorybookBehaviorPlan(['src/shared/ui/Example/Example.vue'], {
      colocatedSpecFiles: [firstSpec, secondSpec],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([firstSpec, secondSpec]);
  });

  it('includes the directly changed spec in the focused selection regardless of discovered-spec ordering, alongside its owner-directory sibling', () => {
    const firstSpec = 'src/shared/ui/Example/First.behavior.spec.ts';
    const secondSpec = 'src/shared/ui/Example/Second.behavior.spec.ts';

    const inDiscoveryOrder = resolveStorybookBehaviorPlan([secondSpec], {
      colocatedSpecFiles: [firstSpec, secondSpec],
      fileExists: () => true,
    });
    const inReverseDiscoveryOrder = resolveStorybookBehaviorPlan([secondSpec], {
      colocatedSpecFiles: [secondSpec, firstSpec],
      fileExists: () => true,
    });

    expect(inDiscoveryOrder.mode).toBe('focused');
    expect(inDiscoveryOrder.specs).toContain(secondSpec);
    expect(inDiscoveryOrder.specs).toEqual([firstSpec, secondSpec]);
    expect(inReverseDiscoveryOrder.specs).toEqual([firstSpec, secondSpec]);
  });

  it('includes a newly added second behavior spec injected via colocatedSpecFiles when that new spec changes', () => {
    const existingSpec = 'src/shared/ui/Example/First.behavior.spec.ts';
    const newSpec = 'src/shared/ui/Example/Second.behavior.spec.ts';
    const plan = resolveStorybookBehaviorPlan([newSpec], {
      colocatedSpecFiles: [existingSpec, newSpec],
      fileExists: () => true,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toContain(newSpec);
    expect(plan.specs).toEqual([existingSpec, newSpec]);
  });

  it('selects every applicable owner-local spec for nested parent/nested owner directories', () => {
    const parentSpec = 'src/shared/ui/Example/Parent.behavior.spec.ts';
    const nestedSpec = 'src/shared/ui/Example/nested/Nested.behavior.spec.ts';
    const changedNestedSource = 'src/shared/ui/Example/nested/NestedHelper.ts';

    const plan = resolveStorybookBehaviorPlan([changedNestedSource], {
      colocatedSpecFiles: [parentSpec, nestedSpec],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([nestedSpec, parentSpec]);
  });

  it('produces the same nested-ownership result regardless of injected spec order', () => {
    const parentSpec = 'src/shared/ui/Example/Parent.behavior.spec.ts';
    const nestedSpec = 'src/shared/ui/Example/nested/Nested.behavior.spec.ts';
    const changedNestedSource = 'src/shared/ui/Example/nested/NestedHelper.ts';

    const inDiscoveryOrder = resolveStorybookBehaviorPlan([changedNestedSource], {
      colocatedSpecFiles: [parentSpec, nestedSpec],
    });
    const inReverseDiscoveryOrder = resolveStorybookBehaviorPlan([changedNestedSource], {
      colocatedSpecFiles: [nestedSpec, parentSpec],
    });

    expect(inDiscoveryOrder.specs).toEqual([nestedSpec, parentSpec]);
    expect(inReverseDiscoveryOrder.specs).toEqual(inDiscoveryOrder.specs);
  });
});

describe('resolveStorybookBehaviorPlan package.json impact', () => {
  beforeEach(() => {
    isPackageJsonRuntimeRelevantChange.mockReset();
  });

  it('reports none for a confirmed version-only package.json change', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(false);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('none');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs the full lane when the package.json change is runtime-relevant (e.g. a Storybook/Playwright dependency bump)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('runtime-relevant package.json change');
  });

  it('runs the full lane when the old package.json ref is missing (fails closed)', () => {
    isPackageJsonRuntimeRelevantChange.mockReturnValue(true);

    const plan = resolveStorybookBehaviorPlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isPackageJsonRuntimeRelevantChange).toHaveBeenCalledWith({ oldRef: null });
  });

  it('does not consult the package.json impact check when package.json did not change', () => {
    resolveStorybookBehaviorPlan(['src/app/setupApp.ts']);

    expect(isPackageJsonRuntimeRelevantChange).not.toHaveBeenCalled();
  });
});
