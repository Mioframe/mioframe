import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./packageJsonImpact.ts', () => ({
  isVisualRelevantPackageJsonChange: vi.fn(),
}));

import { isVisualRelevantPackageJsonChange as isVisualRelevantPackageJsonChangeImport } from './packageJsonImpact.ts';
import {
  findColocatedVisualSpecFiles,
  isBroadVisualRelevantPath,
  isColocatedVisualSpecPath,
  isFullVisualLanePath,
  isSafeVisualExclusionPath,
  resolveVisualPlan,
} from './visualRisk.ts';

const isVisualRelevantPackageJsonChange = vi.mocked(isVisualRelevantPackageJsonChangeImport);

const LOADING_INDICATOR_OWNER_DIR = 'src/shared/ui/material/components/loadingIndicator';
const LOADING_INDICATOR_VISUAL_SPEC = `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.visual.spec.ts`;
const LOADING_INDICATOR_SNAPSHOT_DIR = `${LOADING_INDICATOR_VISUAL_SPEC}-snapshots`;
const LOADING_INDICATOR_TEST = `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.test.ts`;
const LOADING_INDICATOR_BEHAVIOR_SPEC = `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.behavior.spec.ts`;
const LOADING_INDICATOR_DOC = `${LOADING_INDICATOR_OWNER_DIR}/README.md`;

const BUTTON_OWNER_DIR = 'src/shared/ui/material/components/button';
const BUTTON_TEST = `${BUTTON_OWNER_DIR}/MDButton.test.ts`;
const BUTTON_BEHAVIOR_SPEC = `${BUTTON_OWNER_DIR}/MDButton.behavior.spec.ts`;
const BUTTON_DOC = `${BUTTON_OWNER_DIR}/README.md`;
const BUTTON_VUE = `${BUTTON_OWNER_DIR}/MDButton.vue`;

const MD_LIB_TEST = 'src/shared/lib/md/index.test.ts';
const APP_STYLES_CSS = 'src/app/styles/styles.css';

describe('isColocatedVisualSpecPath', () => {
  it('flags owner-local visual specs under src/', () => {
    expect(isColocatedVisualSpecPath(LOADING_INDICATOR_VISUAL_SPEC)).toBe(true);
  });

  it('does not flag non-visual src files or paths outside src/', () => {
    expect(isColocatedVisualSpecPath('tests/e2e/visual/storybook.ts')).toBe(false);
    expect(isColocatedVisualSpecPath(`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`)).toBe(
      false,
    );
    expect(
      isColocatedVisualSpecPath(
        `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.behavior.spec.ts`,
      ),
    ).toBe(false);
  });
});

describe('isFullVisualLanePath', () => {
  it('flags the visual Playwright config and shared runner infrastructure', () => {
    expect(isFullVisualLanePath('playwright.visual.config.ts')).toBe(true);
    expect(isFullVisualLanePath('scripts/playwrightContainer.ts')).toBe(true);
    expect(isFullVisualLanePath('scripts/storybook.mjs')).toBe(true);
    expect(isFullVisualLanePath('scripts/lib/visualRisk.ts')).toBe(true);
    expect(isFullVisualLanePath('config/tooling.json')).toBe(true);
    expect(isFullVisualLanePath('tsconfig.storybook.json')).toBe(true);
    expect(isFullVisualLanePath('pnpm-lock.yaml')).toBe(true);
    expect(isFullVisualLanePath('vite.config.ts')).toBe(true);
    expect(isFullVisualLanePath('scripts/visual.mjs')).toBe(true);
    expect(isFullVisualLanePath('scripts/verify.ts')).toBe(true);
  });

  it('flags any path under .storybook/', () => {
    expect(isFullVisualLanePath('.storybook/main.ts')).toBe(true);
  });

  it('flags global app/base fonts and visual styling', () => {
    expect(isFullVisualLanePath('src/app/styles/base.css')).toBe(true);
    expect(isFullVisualLanePath('src/app/styles/fonts.css')).toBe(true);
  });

  it('does not flag the application-shell stylesheet Storybook does not import', () => {
    expect(isFullVisualLanePath(APP_STYLES_CSS)).toBe(false);
  });

  it('flags the remaining cross-owner visual openStory/stabilization helper', () => {
    expect(isFullVisualLanePath('tests/e2e/visual/storybook.ts')).toBe(true);
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

describe('isSafeVisualExclusionPath', () => {
  it.each([
    ['owner *.test.ts', LOADING_INDICATOR_TEST],
    ['owner *.behavior.spec.ts', LOADING_INDICATOR_BEHAVIOR_SPEC],
    ['owner .md', LOADING_INDICATOR_DOC],
    ['another shared UI owner *.test.ts', BUTTON_TEST],
    ['another shared UI owner *.behavior.spec.ts', BUTTON_BEHAVIOR_SPEC],
    ['another shared UI owner .md', BUTTON_DOC],
    ['src/shared/lib/md/index.test.ts', MD_LIB_TEST],
  ])('flags %s: %s', (_description, filePath) => {
    expect(isSafeVisualExclusionPath(filePath)).toBe(true);
  });

  it.each([
    ['a colocated visual spec', LOADING_INDICATOR_VISUAL_SPEC],
    ['a runtime file', BUTTON_VUE],
    ['a story', `${BUTTON_OWNER_DIR}/MDButton.stories.ts`],
  ])('does not flag %s: %s', (_description, filePath) => {
    expect(isSafeVisualExclusionPath(filePath)).toBe(false);
  });
});

describe('findColocatedVisualSpecFiles', () => {
  let tmpDir: string;

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

describe('resolveVisualPlan cross-owner visual helper', () => {
  it('runs the full lane for a changed openStory/stabilization helper', () => {
    const plan = resolveVisualPlan(['tests/e2e/visual/storybook.ts']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('visual infrastructure path');
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
    expect(resolveVisualPlan(['scripts/verify.ts']).mode).toBe('full');
  });
});

describe('resolveVisualPlan visual owners with no colocated spec', () => {
  it('runs the full lane for a visual-relevant shared UI change with no resolvable colocated owner', () => {
    const plan = resolveVisualPlan(['src/shared/ui/AppBar/MDAppBar.vue']);

    expect(plan.mode).toBe('full');
    expect(plan.reasons[0]).toContain('has no resolvable colocated visual owner');
  });

  it('runs the full lane for a story change with no resolvable colocated owner', () => {
    const plan = resolveVisualPlan(['src/shared/ui/AppBar/MDAppBar.stories.ts']);

    expect(plan.mode).toBe('full');
  });

  it.each([
    ['src/shared/lib/md/index.css'],
    ['src/shared/lib/md/typography.css'],
    ['src/shared/lib/md/space.css'],
  ])(
    'preserves the full lane for the Storybook preview style dependency closure: %s',
    (filePath) => {
      const plan = resolveVisualPlan([filePath]);

      expect(plan.mode).toBe('full');
    },
  );
});

describe('resolveVisualPlan safe non-visual proof/documentation exclusions', () => {
  it.each([
    ['owner *.test.ts, colocated with a visual spec', LOADING_INDICATOR_TEST],
    ['owner *.behavior.spec.ts, colocated with a visual spec', LOADING_INDICATOR_BEHAVIOR_SPEC],
    ['owner .md, colocated with a visual spec', LOADING_INDICATOR_DOC],
    ['another shared UI owner *.test.ts', BUTTON_TEST],
    ['another shared UI owner *.behavior.spec.ts', BUTTON_BEHAVIOR_SPEC],
    ['another shared UI owner .md', BUTTON_DOC],
    ['src/shared/lib/md/index.test.ts', MD_LIB_TEST],
    ['the application-shell stylesheet Storybook does not import', APP_STYLES_CSS],
  ])('skips %s: %s', (_description, filePath) => {
    expect(resolveVisualPlan([filePath]).mode).toBe('skip');
  });
});

describe('resolveVisualPlan mixed changes', () => {
  it('stays skip when only safe proof-only paths change, across multiple owner directories', () => {
    const plan = resolveVisualPlan([LOADING_INDICATOR_TEST, LOADING_INDICATOR_DOC, BUTTON_TEST], {
      colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC],
    });

    expect(plan.mode).toBe('skip');
  });

  it('combines a safe proof-only path with a focused runtime change to stay focused', () => {
    const plan = resolveVisualPlan(
      [LOADING_INDICATOR_TEST, `${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`],
      { colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC] },
    );

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC]);
  });

  it('falls back to full when a focused owner change accompanies an unresolvable visually-relevant path', () => {
    const plan = resolveVisualPlan(
      [`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`, BUTTON_VUE],
      { colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC] },
    );

    expect(plan.mode).toBe('full');
  });

  it('falls back to full when a focused owner change accompanies global infrastructure', () => {
    const plan = resolveVisualPlan(
      [`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`, '.storybook/main.ts'],
      { colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC] },
    );

    expect(plan.mode).toBe('full');
  });

  it('unions and deduplicates visual specs from multiple distinct focused owners', () => {
    const buttonSpec = `${BUTTON_OWNER_DIR}/MDButton.visual.spec.ts`;
    const plan = resolveVisualPlan(
      [`${LOADING_INDICATOR_OWNER_DIR}/MDLoadingIndicator.vue`, BUTTON_VUE],
      { colocatedSpecFiles: [LOADING_INDICATOR_VISUAL_SPEC, buttonSpec] },
    );

    expect(plan.mode).toBe('focused');
    expect(plan.specs).toEqual([LOADING_INDICATOR_VISUAL_SPEC, buttonSpec].sort());
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
