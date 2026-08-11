import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.mjs', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
}));

import { isVisualRelevantPackageJsonChange } from './packageJsonImpact.mjs';
import {
  findColocatedVisualSpecFiles,
  isBroadVisualRelevantPath,
  isColocatedVisualSpecPath,
  isFullVisualLanePath,
  isLegacyVisualPath,
  resolveVisualPlan,
} from './visualRisk.mjs';

const LOADING_INDICATOR_OWNER_DIR = 'src/shared/ui/material/components/loadingIndicator';
const LOADING_INDICATOR_VISUAL_SPEC = `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.visual.spec.ts`;
const LOADING_INDICATOR_SNAPSHOT_DIR = `${LOADING_INDICATOR_VISUAL_SPEC}-snapshots`;

describe('isColocatedVisualSpecPath', () => {
  it('flags owner-local visual specs under src/', () => {
    expect(isColocatedVisualSpecPath(LOADING_INDICATOR_VISUAL_SPEC)).toBe(true);
  });

  it('does not flag legacy centralized specs or non-visual src files', () => {
    expect(isColocatedVisualSpecPath('tests/e2e/visual/shared-ui/md-button.spec.ts')).toBe(false);
    expect(isColocatedVisualSpecPath(`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`)).toBe(
      false,
    );
    expect(
      isColocatedVisualSpecPath(
        `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.browser.spec.ts`,
      ),
    ).toBe(false);
  });
});

describe('isLegacyVisualPath', () => {
  it('flags any path under tests/e2e/visual/', () => {
    expect(isLegacyVisualPath('tests/e2e/visual/shared-ui/md-button.spec.ts')).toBe(true);
    expect(isLegacyVisualPath('tests/e2e/visual/storybook.ts')).toBe(true);
    expect(
      isLegacyVisualPath('tests/e2e/visual/shared-ui/md-button.spec.ts-snapshots/md-button.png'),
    ).toBe(true);
  });

  it('does not flag colocated or unrelated paths', () => {
    expect(isLegacyVisualPath(LOADING_INDICATOR_VISUAL_SPEC)).toBe(false);
    expect(isLegacyVisualPath('tests/e2e/storybook/colorOwnership.spec.ts')).toBe(false);
  });
});

describe('isFullVisualLanePath', () => {
  it('flags the visual Playwright config and shared runner infrastructure', () => {
    expect(isFullVisualLanePath('playwright.visual.config.ts')).toBe(true);
    expect(isFullVisualLanePath('scripts/playwrightContainer.mjs')).toBe(true);
    expect(isFullVisualLanePath('scripts/storybook.mjs')).toBe(true);
    expect(isFullVisualLanePath('scripts/lib/visualRisk.mjs')).toBe(true);
    expect(isFullVisualLanePath('config/tooling.json')).toBe(true);
    expect(isFullVisualLanePath('tsconfig.storybook.json')).toBe(true);
    expect(isFullVisualLanePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullVisualLanePath('vite.config.ts')).toBe(true);
    expect(isFullVisualLanePath('scripts/visual.mjs')).toBe(true);
    expect(isFullVisualLanePath('scripts/verify.mjs')).toBe(true);
  });

  it('flags any path under .storybook/', () => {
    expect(isFullVisualLanePath('.storybook/main.ts')).toBe(true);
  });

  it('flags global app/base fonts and visual styling', () => {
    expect(isFullVisualLanePath('src/app/styles/base.css')).toBe(true);
    expect(isFullVisualLanePath('src/app/styles/fonts.css')).toBe(true);
    expect(isFullVisualLanePath('src/app/styles/styles.css')).toBe(true);
  });

  it('flags the entire legacy central visual subtree', () => {
    expect(isFullVisualLanePath('tests/e2e/visual/storybook.ts')).toBe(true);
    expect(isFullVisualLanePath('tests/e2e/visual/shared-ui/md-button.spec.ts')).toBe(true);
    expect(
      isFullVisualLanePath('tests/e2e/visual/shared-ui/md-button.spec.ts-snapshots/md-button.png'),
    ).toBe(true);
  });

  it('does not flag unrelated source paths', () => {
    expect(isFullVisualLanePath('src/features/documentCreate/index.ts')).toBe(false);
    expect(isFullVisualLanePath(LOADING_INDICATOR_VISUAL_SPEC)).toBe(false);
  });
});

describe('isBroadVisualRelevantPath', () => {
  it('flags shared UI, shared md, and story files', () => {
    expect(isBroadVisualRelevantPath('src/shared/ui/material/components/button/MDButton.vue')).toBe(
      true,
    );
    expect(isBroadVisualRelevantPath('src/shared/lib/md/typography.css')).toBe(true);
    expect(
      isBroadVisualRelevantPath('src/shared/ui/material/components/button/MDButton.stories.ts'),
    ).toBe(true);
  });

  it('does not flag unrelated source paths', () => {
    expect(isBroadVisualRelevantPath('src/features/documentCreate/index.ts')).toBe(false);
    expect(isBroadVisualRelevantPath('src/entities/document/model/document.ts')).toBe(false);
  });
});

describe('findColocatedVisualSpecFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'colocated-visual-spec-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('recursively discovers nested *.visual.spec.ts files and ignores other files', () => {
    fs.mkdirSync(path.join(tmpDir, 'owner'), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.visual.spec.ts'), '');
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.vue'), '');
    fs.writeFileSync(path.join(tmpDir, 'owner', 'Owner.browser.spec.ts'), '');

    expect(findColocatedVisualSpecFiles(tmpDir)).toEqual([
      path.posix.join(tmpDir, 'owner/Owner.visual.spec.ts'),
    ]);
  });

  it('discovers the real colocated Loading Indicator visual spec under src/', () => {
    expect(findColocatedVisualSpecFiles()).toContain(LOADING_INDICATOR_VISUAL_SPEC);
  });
});

describe('resolveVisualPlan colocated spec ownership', () => {
  it('selects itself when the colocated Loading Indicator visual spec changes', () => {
    const plan = resolveVisualPlan([LOADING_INDICATOR_VISUAL_SPEC]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('selects the colocated spec for a Loading Indicator component change', () => {
    const plan = resolveVisualPlan([`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('selects the colocated spec for a Loading Indicator story change', () => {
    const plan = resolveVisualPlan([
      `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.stories.ts`,
    ]);

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('does not select a colocated spec for an unrelated non-visual-relevant src change', () => {
    const plan = resolveVisualPlan(['src/entities/document/model/document.ts']);

    expect(plan.mode).toBe('skip');
  });

  it('runs the full lane for a removed colocated visual spec', () => {
    const plan = resolveVisualPlan([LOADING_INDICATOR_VISUAL_SPEC], { fileExists: () => false });

    expect(plan.mode).toBe('full');
    expect(plan.specs).toEqual([]);
    expect(plan.reasons[0]).toContain(
      `removed or renamed colocated visual spec ${LOADING_INDICATOR_VISUAL_SPEC}`,
    );
  });

  it('runs the full lane for a rename-like input where the old colocated spec no longer exists', () => {
    const oldSpecPath = `${LOADING_INDICATOR_OWNER_DIR}/OldLoadingIndicator.visual.spec.ts`;
    const plan = resolveVisualPlan([oldSpecPath, LOADING_INDICATOR_VISUAL_SPEC], {
      fileExists: (filePath) => filePath !== oldSpecPath,
    });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain(`removed or renamed colocated visual spec ${oldSpecPath}`);
  });

  it('resolves colocated ownership from an injected colocatedSpecFiles override rather than only the real filesystem', () => {
    const ownerSpec = 'src/shared/ui/Example/Example.visual.spec.ts';
    const plan = resolveVisualPlan(['src/shared/ui/Example/Example.vue'], {
      colocatedSpecFiles: [ownerSpec],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([ownerSpec]);
  });

  it('adds a newly added local visual spec to the focused selection', () => {
    const existingSpec = 'src/shared/ui/Example/First.visual.spec.ts';
    const newSpec = 'src/shared/ui/Example/Second.visual.spec.ts';
    const plan = resolveVisualPlan([newSpec], {
      colocatedSpecFiles: [existingSpec, newSpec],
      fileExists: () => true,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toContain(newSpec);
  });

  it('selects every colocated visual spec in the same owner directory for an owner-source change, independent of discovery order', () => {
    const firstSpec = 'src/shared/ui/Example/First.visual.spec.ts';
    const secondSpec = 'src/shared/ui/Example/Second.visual.spec.ts';

    const inDiscoveryOrder = resolveVisualPlan(['src/shared/ui/Example/Example.vue'], {
      colocatedSpecFiles: [firstSpec, secondSpec],
    });
    const inReverseDiscoveryOrder = resolveVisualPlan(['src/shared/ui/Example/Example.vue'], {
      colocatedSpecFiles: [secondSpec, firstSpec],
    });

    expect(inDiscoveryOrder.mode).toBe('focused');
    expect(inDiscoveryOrder.specs).toEqual([firstSpec, secondSpec]);
    expect(inReverseDiscoveryOrder.specs).toEqual([firstSpec, secondSpec]);
  });
});

describe('resolveVisualPlan colocated baseline ownership', () => {
  it('selects the owning spec for a modified local baseline', () => {
    const baseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-sizes-linux.png`;
    const plan = resolveVisualPlan([baseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('selects the owning spec for an added local baseline', () => {
    const baseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-new-linux.png`;
    const plan = resolveVisualPlan([baseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
      fileExists: () => false,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('selects the owning spec for a removed local baseline when the owner spec still exists', () => {
    const baseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-sizes-linux.png`;
    const plan = resolveVisualPlan([baseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
      fileExists: (filePath) => filePath !== baseline,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('selects the owning spec for both sides of a resolvable local baseline rename', () => {
    const oldBaseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-old-linux.png`;
    const newBaseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-new-linux.png`;
    const plan = resolveVisualPlan([oldBaseline, newBaseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
      fileExists: (filePath) => filePath !== oldBaseline,
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('does not cross-attribute a baseline to a sibling spec in a multi-spec owner directory', () => {
    const secondSpec = `${LOADING_INDICATOR_OWNER_DIR}/OtherMatrix.visual.spec.ts`;
    const baseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-sizes-linux.png`;
    const plan = resolveVisualPlan([baseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC, secondSpec],
    });

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('runs the full lane for an orphan baseline whose owner spec is missing', () => {
    const baseline = `${LOADING_INDICATOR_SNAPSHOT_DIR}/md-loading-indicator-sizes-linux.png`;
    const plan = resolveVisualPlan([baseline], { colocatedSpecFiles: [] });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('unresolved colocated visual baseline ownership');
  });

  it('runs the full lane for an orphan baseline left behind by a spec rename', () => {
    const orphanBaseline = `${LOADING_INDICATOR_OWNER_DIR}/OldMatrix.visual.spec.ts-snapshots/old-linux.png`;
    const plan = resolveVisualPlan([orphanBaseline], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
    });

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('unresolved colocated visual baseline ownership');
  });
});

describe('resolveVisualPlan legacy central visual execution', () => {
  it('runs the full lane for a changed legacy central visual spec', () => {
    const plan = resolveVisualPlan(['tests/e2e/visual/shared-ui/md-button.spec.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('visual infrastructure path');
  });

  it('runs the full lane for a changed legacy central visual snapshot', () => {
    const plan = resolveVisualPlan([
      'tests/e2e/visual/shared-ui/md-button.spec.ts-snapshots/md-button-states-linux.png',
    ]);

    expect(plan.mode).toBe('full');
  });

  it('runs the full lane for a changed legacy central visual helper', () => {
    const plan = resolveVisualPlan(['tests/e2e/visual/storybook.ts']);

    expect(plan.mode).toBe('full');
  });
});

describe('resolveVisualPlan global infrastructure', () => {
  it('runs the full lane for the visual Playwright config', () => {
    const plan = resolveVisualPlan(['playwright.visual.config.ts']);

    expect(plan.mode).toBe('full');
  });

  it('runs the full lane for a .storybook/ path change', () => {
    const plan = resolveVisualPlan(['.storybook/main.ts']);

    expect(plan.mode).toBe('full');
  });

  it('runs the full lane for global app fonts/base styling', () => {
    expect(resolveVisualPlan(['src/app/styles/base.css']).mode).toBe('full');
    expect(resolveVisualPlan(['src/app/styles/fonts.css']).mode).toBe('full');
  });

  it('runs the full lane for the visual lane execution entry point', () => {
    expect(resolveVisualPlan(['scripts/visual.mjs']).mode).toBe('full');
  });

  it('runs the full lane for the verify planner entry point', () => {
    expect(resolveVisualPlan(['scripts/verify.mjs']).mode).toBe('full');
  });
});

describe('resolveVisualPlan unmigrated visual owners', () => {
  it('runs the full lane for a visual-relevant shared UI change with no resolvable colocated owner', () => {
    const plan = resolveVisualPlan(['src/shared/ui/material/components/button/MDButton.vue']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('has no resolvable colocated visual owner');
  });

  it('runs the full lane for an unmigrated story change', () => {
    const plan = resolveVisualPlan([
      'src/shared/ui/material/components/button/MDButton.stories.ts',
    ]);

    expect(plan.mode).toBe('full');
  });
});

describe('resolveVisualPlan unrelated changes', () => {
  it('skips for an unrelated source change', () => {
    const plan = resolveVisualPlan(['src/features/documentCreate/index.ts']);

    expect(plan.mode).toBe('skip');
    expect(plan.specs).toEqual([]);
  });
});

describe('resolveVisualPlan package.json impact', () => {
  beforeEach(() => {
    isVisualRelevantPackageJsonChange.mockReset();
  });

  it('skips visual for a confirmed version-only package.json change with no other relevant files', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(false);

    const plan = resolveVisualPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('skip');
    expect(isVisualRelevantPackageJsonChange).toHaveBeenCalledWith({ oldRef: 'HEAD~1' });
  });

  it('runs the full lane when the package.json impact check is runtime-relevant', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(true);

    const plan = resolveVisualPlan(['package.json'], { packageJsonOldRef: 'HEAD~1' });

    expect(plan.mode).toBe('full');
  });

  it('runs the full lane when the package.json comparison cannot be resolved', () => {
    isVisualRelevantPackageJsonChange.mockReturnValue(true);

    const plan = resolveVisualPlan(['package.json'], { packageJsonOldRef: null });

    expect(plan.mode).toBe('full');
    expect(isVisualRelevantPackageJsonChange).toHaveBeenCalledWith({ oldRef: null });
  });
});
