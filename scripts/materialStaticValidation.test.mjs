import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

import {
  CODES,
  formatFinding,
  getFilesAtRef,
  validateMaterialLibrary,
} from './materialStaticValidation.mjs';

const SCRIPT_PATH = path.resolve(process.cwd(), 'scripts/materialStaticValidation.mjs');

/**
 * Create a minimal temp repository with the given files.
 * @param files Map of repository-relative path to content; `null` creates a directory.
 * @returns Absolute temp repository root.
 */
function makeTempRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-static-test-'));

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });

    if (content === null) {
      fs.mkdirSync(absolutePath, { recursive: true });
    } else {
      fs.writeFileSync(absolutePath, content, 'utf8');
    }
  }

  return root;
}

/**
 * Fake `spawnSync` reporting a fixed set of files "at the base ref".
 * @param fileList Repository-relative paths to report as existing at the ref.
 * @returns A `spawnSync`-shaped function.
 */
function fakeSpawnWithFiles(fileList) {
  return () => ({ status: 0, stdout: fileList.join('\n') });
}

const tempRoots = [];

function tempRepo(files) {
  const root = makeTempRepo(files);
  tempRoots.push(root);
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop(), { recursive: true, force: true });
  }
});

function findingCodes(findings) {
  return findings.map((item) => item.code);
}

function findingsFor(findings, code) {
  return findings.filter((item) => item.code === code);
}

const README_CONTENT = '# Family blueprint\n\nMATERIAL COMPONENT BLUEPRINT\n';

function validStory(componentName, kebabName) {
  return [
    "import type { Meta, StoryObj } from '@storybook/vue3';",
    `import Component from './${componentName}.vue';`,
    '',
    'export const StateMatrix: StoryObj = {',
    '  render: () => ({',
    '    components: { Component },',
    `    template: '<div class="visual-checker-backdrop"><div data-testid="visual-${kebabName}-state-matrix"><Component /></div></div>',`,
    '  }),',
    '};',
    '',
  ].join('\n');
}

function validVisualSpec(kebabName) {
  return [
    "import { test } from '@playwright/test';",
    '',
    `test('${kebabName} state matrix', async ({ page }) => {`,
    `  await page.getByTestId('visual-${kebabName}-state-matrix').screenshot();`,
    '});',
    '',
  ].join('\n');
}

function validComponentTest(componentName) {
  return [
    "import { mount } from '@vue/test-utils';",
    "import { describe, expect, it } from 'vitest';",
    `import Component from './${componentName}.vue';`,
    '',
    `describe('${componentName}', () => {`,
    "  it('renders', () => {",
    '    expect(mount(Component).exists()).toBe(true);',
    '  });',
    '});',
    '',
  ].join('\n');
}

function componentVue(componentName, cssFiles) {
  const imports = cssFiles.map((file) => `import './${file}';`).join('\n');
  return [
    '<script setup lang="ts">',
    imports,
    '</script>',
    '<template>',
    `  <button class="${componentName.toLowerCase()}">slot</button>`,
    '</template>',
    '',
  ].join('\n');
}

function buildValidFamily({ family, componentName, profile }) {
  const kebabName = componentName.slice(2).toLowerCase();
  const cssFiles = [];

  if (profile === 'configured' || profile === 'configured-stateful') {
    cssFiles.push(`${componentName}.routes.css`);
  }

  if (profile === 'stateful' || profile === 'configured-stateful') {
    cssFiles.push(`${componentName}.states.css`);
  }

  cssFiles.push(`${componentName}.css`);

  const familyPrefix = `src/shared/ui/material/components/${family}`;
  const files = {
    [`${familyPrefix}/README.md`]: README_CONTENT,
    [`${familyPrefix}/index.ts`]: `export { default as ${componentName} } from './${componentName}.vue';\n`,
    [`${familyPrefix}/${componentName}.vue`]: componentVue(componentName, cssFiles),
    [`${familyPrefix}/${componentName}.test.ts`]: validComponentTest(componentName),
    [`${familyPrefix}/${componentName}.stories.ts`]: validStory(componentName, kebabName),
    [`tests/e2e/visual/material/${family}.spec.ts`]: validVisualSpec(kebabName),
  };

  for (const cssFile of cssFiles) {
    files[`${familyPrefix}/${cssFile}`] = `.${componentName.toLowerCase()} { color: red; }\n`;
  }

  return files;
}

describe('canonical library structure', () => {
  it('accepts a valid empty canonical Material library before the first migration', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/AGENTS.md': '# agents\n',
    });

    expect(validateMaterialLibrary({ repoRoot: root, baseRef: null })).toEqual([]);
  });

  it('accepts library governance files without runtime artifacts', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/AGENTS.md': '# agents\n',
      'src/shared/ui/material/CLAUDE.md': '@AGENTS.md\n',
    });

    expect(validateMaterialLibrary({ repoRoot: root, baseRef: null })).toEqual([]);
  });

  it('blocks a premature root barrel before an honest production artifact exists', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/index.ts': "export * from './foundation';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PREMATURE_ROOT_BARREL);
  });

  it('accepts a root barrel once an honest production artifact exists', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/foundation/tokens/index.ts': 'export const tokens = {};\n',
      'src/shared/ui/material/index.ts': "export * from './foundation/tokens';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_PREMATURE_ROOT_BARREL);
    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_INVALID_PUBLIC_EXPORT);
  });

  it('blocks an unknown top-level runtime namespace', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/utils/helper.ts': 'export const helper = 1;\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_UNKNOWN_NAMESPACE,
        path: 'src/shared/ui/material/utils',
      }),
    );
  });

  it('blocks an empty production artifact', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/foundation/tokens/index.ts': '',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_EMPTY_PRODUCTION_FILE);
  });

  it('blocks a placeholder artifact containing only comments', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/foundation/tokens/index.ts': '// TODO: implement\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });

  it('blocks a speculative empty directory', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/components/button': null,
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
        path: 'src/shared/ui/material/components/button',
      }),
    );
  });

  it('blocks a .gitkeep placeholder file', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/foundation/.gitkeep': '',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_PLACEHOLDER_ARTIFACT);
  });
});

describe('new legacy ownership prevention (diff-aware)', () => {
  it('blocks a newly added official MD*.vue component in a legacy path', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/NewFamily/MDNewThing.vue': '<template><div /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'fake',
      spawn: fakeSpawnWithFiles(['src/shared/ui/material/README.md']),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY,
        path: 'src/shared/ui/NewFamily/MDNewThing.vue',
      }),
    );
  });

  it('allows modification of a pre-existing legacy component', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'fake',
      spawn: fakeSpawnWithFiles([
        'src/shared/ui/material/README.md',
        'src/shared/ui/Button/MDButton.vue',
      ]),
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });

  it('blocks a new standalone Material legacy foundation owner', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/lib/md/newTokens.css': '.new { color: red; }\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'fake',
      spawn: fakeSpawnWithFiles(['src/shared/ui/material/README.md']),
    });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_NEW_LEGACY_OWNER,
        path: 'src/shared/lib/md/newTokens.css',
      }),
    );
  });

  it('does not misclassify an ordinary product-specific "Md" filename as an official component', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/Icon/MdiIconRenderer.vue': '<template><div /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'fake',
      spawn: fakeSpawnWithFiles(['src/shared/ui/material/README.md']),
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });

  it('skips new-ownership checks when the base ref cannot be resolved', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/NewFamily/MDNewThing.vue': '<template><div /></template>\n',
    });
    const findings = validateMaterialLibrary({
      repoRoot: root,
      baseRef: 'unresolvable',
      spawn: () => ({ status: 128, stdout: '' }),
    });

    expect(findingCodes(findings)).not.toContain(CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY);
  });
});

describe('dependency direction and imports', () => {
  it('blocks a product-layer import from inside the Material library', () => {
    const root = tempRepo({
      'src/shared/ui/material/foundation/tokens/index.ts':
        "export { widgetHelper } from '@feature/someFeature/model';\n",
      'src/features/someFeature/model.ts': 'export const widgetHelper = 1;\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_PRODUCT_IMPORT,
        path: 'src/shared/ui/material/foundation/tokens/index.ts',
      }),
    );
  });

  it('blocks foundation importing a component', () => {
    const root = tempRepo({
      'src/shared/ui/material/foundation/tokens/index.ts':
        "export { MDButton } from '../../components/button/MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_FOUNDATION_UPWARD_IMPORT,
        path: 'src/shared/ui/material/foundation/tokens/index.ts',
      }),
    );
  });

  it('blocks foundation importing a pattern', () => {
    const root = tempRepo({
      'src/shared/ui/material/foundation/tokens/index.ts':
        "export { fabMenu } from '../../patterns/fabMenu/index.ts';\n",
      'src/shared/ui/material/patterns/fabMenu/index.ts': 'export const fabMenu = {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_FOUNDATION_UPWARD_IMPORT,
        path: 'src/shared/ui/material/foundation/tokens/index.ts',
      }),
    );
  });

  it('blocks a component importing a pattern', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': [
        '<script setup lang="ts">',
        "import { fabMenu } from '../../patterns/fabMenu';",
        '</script>',
        '<template><button /></template>',
        '',
      ].join('\n'),
      'src/shared/ui/material/patterns/fabMenu/index.ts': 'export const fabMenu = {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_COMPONENT_PATTERN_IMPORT,
        path: 'src/shared/ui/material/components/button/MDButton.vue',
      }),
    );
  });

  it('blocks a generic shared/lib utility importing the Material library', () => {
    const root = tempRepo({
      'src/shared/lib/genericHelper.ts': "export { md } from '@shared/ui/material';\n",
      'src/shared/ui/material/foundation/tokens/index.ts': 'export const tokens = {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_GENERIC_LIB_IMPORTS_MATERIAL,
        path: 'src/shared/lib/genericHelper.ts',
      }),
    );
  });

  it('does not misclassify an accepted legacy Material owner under shared/lib as generic', () => {
    const root = tempRepo({
      'src/shared/lib/md/legacyTokens.ts': "export { md } from '@shared/ui/material';\n",
      'src/shared/ui/material/foundation/tokens/index.ts': 'export const tokens = {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingsFor(findings, CODES.MATERIAL_GENERIC_LIB_IMPORTS_MATERIAL)).toEqual([]);
  });

  it('blocks an internal root-barrel import from inside the library', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': [
        '<script setup lang="ts">',
        "import { MDButton } from '@shared/ui/material';",
        '</script>',
        '<template><button /></template>',
        '',
      ].join('\n'),
      'src/shared/ui/material/index.ts': "export * from './components/button';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_INTERNAL_ROOT_BARREL_IMPORT,
        path: 'src/shared/ui/material/components/button/MDButton.vue',
      }),
    );
  });

  it('blocks a private cross-family import', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/MDButton.vue': [
        '<script setup lang="ts">',
        "import Switch from '../switch/MDSwitch.vue';",
        '</script>',
        '<template><button /></template>',
        '',
      ].join('\n'),
      'src/shared/ui/material/components/switch/MDSwitch.vue': '<template><input /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_PRIVATE_CROSS_FAMILY_IMPORT,
        path: 'src/shared/ui/material/components/button/MDButton.vue',
      }),
    );
  });

  it('blocks an external deep import into a component .vue implementation', () => {
    const root = tempRepo({
      'src/features/someFeature/index.ts':
        "export { default } from '@shared/ui/material/components/button/MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_EXTERNAL_DEEP_IMPORT,
        path: 'src/features/someFeature/index.ts',
      }),
    );
  });

  it('blocks an external deep import into a component CSS implementation', () => {
    const root = tempRepo({
      'src/features/someFeature/index.ts':
        "import '@shared/ui/material/components/button/MDButton.css';\n",
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_EXTERNAL_DEEP_IMPORT,
        path: 'src/features/someFeature/index.ts',
      }),
    );
  });

  it('blocks an external deep import into a private/testing file', () => {
    const root = tempRepo({
      'src/features/someFeature/index.ts':
        "export { default } from '@shared/ui/material/components/button/MDButton.test.ts';\n",
      'src/shared/ui/material/components/button/MDButton.test.ts': 'export default {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_EXTERNAL_DEEP_IMPORT,
        path: 'src/features/someFeature/index.ts',
      }),
    );
  });

  it('allows a valid external import of a public family entry point', () => {
    const root = tempRepo({
      'src/features/someFeature/index.ts':
        "export { MDButton } from '@shared/ui/material/components/button';\n",
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingsFor(findings, CODES.MATERIAL_EXTERNAL_DEEP_IMPORT)).toEqual([]);
  });
});

describe('public exports', () => {
  it('blocks an invalid production export target that does not exist', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.test.ts': 'export default {};\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_INVALID_PUBLIC_EXPORT,
        path: 'src/shared/ui/material/components/button/index.ts',
      }),
    );
  });

  it('blocks a testing artifact exported through the production API', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/MDButton.vue': '<template><button /></template>\n',
      'src/shared/ui/material/components/button/MDButton.test.ts': 'export const helper = 1;\n',
      'src/shared/ui/material/components/button/index.ts': [
        "export { default as MDButton } from './MDButton.vue';",
        "export { helper } from './MDButton.test.ts';",
        '',
      ].join('\n'),
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_TESTING_EXPORT_IN_PRODUCTION_API,
        path: 'src/shared/ui/material/components/button/index.ts',
      }),
    );
  });

  it('blocks a CSS file exported through the production API', () => {
    const root = tempRepo({
      'src/shared/ui/material/foundation/tokens/README.md': README_CONTENT,
      'src/shared/ui/material/foundation/tokens/tokens.css': '.x {}\n',
      'src/shared/ui/material/foundation/tokens/index.ts': "export * from './tokens.css';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_CSS_EXPORT_IN_PRODUCTION_API,
        path: 'src/shared/ui/material/foundation/tokens/index.ts',
      }),
    );
  });

  it('blocks a private/internal-named export from the production API', () => {
    const root = tempRepo({
      'src/shared/ui/material/foundation/tokens/README.md': README_CONTENT,
      'src/shared/ui/material/foundation/tokens/internalHelper.ts': 'export const helper = 1;\n',
      'src/shared/ui/material/foundation/tokens/index.ts':
        "export { helper } from './internalHelper.ts';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_PRIVATE_EXPORT,
        path: 'src/shared/ui/material/foundation/tokens/index.ts',
      }),
    );
  });
});

describe('component production profiles', () => {
  const profiles = ['simple', 'configured', 'stateful', 'configured-stateful'];

  for (const profile of profiles) {
    it(`accepts a valid "${profile}" component profile`, () => {
      const files = buildValidFamily({ family: 'button', componentName: 'MDButton', profile });
      const root = tempRepo(files);
      const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

      expect(findings).toEqual([]);
    });
  }

  it('blocks an orphan .routes.css layer with no matching component', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/material/components/button/MDGhost.routes.css': '.ghost {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_ORPHAN_PRODUCTION_LAYER,
        path: 'src/shared/ui/material/components/button/MDGhost.routes.css',
      }),
    );
  });

  it('blocks an orphan primary .css layer with no matching component', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/material/components/button/MDGhost.css': '.ghost {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_ORPHAN_PRODUCTION_LAYER,
        path: 'src/shared/ui/material/components/button/MDGhost.css',
      }),
    );
  });

  it('blocks an empty production layer', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.routes.css',
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.routes.css': '',
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_EMPTY_PRODUCTION_LAYER,
        path: 'src/shared/ui/material/components/button/MDButton.routes.css',
      }),
    );
  });

  it('blocks an unknown/undeclared production-file category', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/material/components/button/randomHelper.ts': 'export const x = 1;\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_UNDECLARED_PRODUCTION_LAYER,
        path: 'src/shared/ui/material/components/button/randomHelper.ts',
      }),
    );
  });

  it('blocks an incorrect CSS import order', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
        'MDButton.states.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/material/components/button/MDButton.states.css': '.md-button--pressed {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_INVALID_CSS_LAYER_ORDER,
        path: 'src/shared/ui/material/components/button/MDButton.vue',
      }),
    );
  });

  it('accepts a valid CSS import order with optional layers omitted', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.routes.css',
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.routes.css': '.md-button--filled {}\n',
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/material/components/button/MDButton.test.ts': validComponentTest('MDButton'),
      'src/shared/ui/material/components/button/MDButton.stories.ts': validStory(
        'MDButton',
        'button',
      ),
      'tests/e2e/visual/material/button.spec.ts': validVisualSpec('button'),
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingsFor(findings, CODES.MATERIAL_INVALID_CSS_LAYER_ORDER)).toEqual([]);
  });

  it('blocks an inline <style> block in a canonical component', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': [
        '<script setup lang="ts">',
        "import './MDButton.css';",
        '</script>',
        '<template><button /></template>',
        '<style scoped>.md-button { color: red; }</style>',
        '',
      ].join('\n'),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_INLINE_COMPONENT_STYLE,
        path: 'src/shared/ui/material/components/button/MDButton.vue',
      }),
    );
  });
});

describe('component production files', () => {
  it('blocks a missing family README', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_COMPONENT_README);
  });

  it('blocks a missing family entry point', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_COMPONENT_ENTRY_POINT);
  });

  it('blocks a missing colocated component contract test', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    delete files['src/shared/ui/material/components/button/MDButton.test.ts'];
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_COMPONENT_CONTRACT_TEST);
  });
});

describe('standard static proof artifacts', () => {
  it('blocks a missing Storybook story', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    delete files['src/shared/ui/material/components/button/MDButton.stories.ts'];
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_COMPONENT_STORY);
  });

  it('blocks a missing StateMatrix export', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    files['src/shared/ui/material/components/button/MDButton.stories.ts'] = [
      "import Component from './MDButton.vue';",
      'export const Overview = { render: () => ({ components: { Component } }) };',
      '',
    ].join('\n');
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_STATE_MATRIX);
  });

  it('blocks duplicate competing StateMatrix stories for one component', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    files['src/shared/ui/material/components/button/MDButtonAlt.stories.ts'] = validStory(
      'MDButton',
      'button',
    );
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_DUPLICATE_STATE_MATRIX);
  });

  it('blocks an invalid state-matrix root anchor', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    files['src/shared/ui/material/components/button/MDButton.stories.ts'] = [
      "import Component from './MDButton.vue';",
      '',
      'export const StateMatrix = {',
      '  render: () => ({',
      '    components: { Component },',
      '    template: \'<div class="visual-checker-backdrop"><Component /></div>\',',
      '  }),',
      '};',
      '',
    ].join('\n');
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_INVALID_STATE_MATRIX_ROOT);
  });

  it('blocks a missing checkerboard backdrop', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    files['src/shared/ui/material/components/button/MDButton.stories.ts'] = [
      "import Component from './MDButton.vue';",
      '',
      'export const StateMatrix = {',
      '  render: () => ({',
      '    components: { Component },',
      '    template: \'<div data-testid="visual-button-state-matrix"><Component /></div>\',',
      '  }),',
      '};',
      '',
    ].join('\n');
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_CHECKERBOARD_BACKDROP);
  });

  it('blocks a missing visual regression spec', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    delete files['tests/e2e/visual/material/button.spec.ts'];
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_MISSING_VISUAL_SPEC);
  });

  it('blocks a visual spec not linked to the canonical matrix', () => {
    const files = buildValidFamily({
      family: 'button',
      componentName: 'MDButton',
      profile: 'simple',
    });
    files['tests/e2e/visual/material/button.spec.ts'] = [
      "import { test } from '@playwright/test';",
      "test('unrelated', async ({ page }) => {",
      "  await page.getByTestId('some-other-surface').screenshot();",
      '});',
      '',
    ].join('\n');
    const root = tempRepo(files);
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findingCodes(findings)).toContain(CODES.MATERIAL_INVALID_VISUAL_SPEC_LINK);
  });
});

describe('completed migration residue', () => {
  it('blocks a canonical owner with a residual parallel legacy owner', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/Button/index.ts': "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_PARALLEL_LEGACY_OWNER,
        path: 'src/shared/ui/Button/index.ts',
      }),
    );
  });

  it('blocks a residual legacy compatibility export forwarding to the canonical owner', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/Button/index.ts':
        "export { MDButton } from '@shared/ui/material/components/button';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_LEGACY_COMPAT_EXPORT,
        path: 'src/shared/ui/Button/index.ts',
      }),
    );
  });

  it('blocks a residual legacy consumer import after a canonical owner exists', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/Button/index.ts': "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
      'src/features/someFeature/index.ts': "import { MDButton } from '@shared/ui/Button';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_LEGACY_CONSUMER_IMPORT,
        path: 'src/features/someFeature/index.ts',
      }),
    );
  });

  it('classifies a stale test/story reference to the obsolete owner as MATERIAL_STALE_LEGACY_REFERENCE', () => {
    const root = tempRepo({
      'src/shared/ui/material/components/button/README.md': README_CONTENT,
      'src/shared/ui/material/components/button/index.ts':
        "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/material/components/button/MDButton.vue': componentVue('MDButton', [
        'MDButton.css',
      ]),
      'src/shared/ui/material/components/button/MDButton.css': '.md-button {}\n',
      'src/shared/ui/Button/index.ts': "export { default as MDButton } from './MDButton.vue';\n",
      'src/shared/ui/Button/MDButton.vue': '<template><button /></template>\n',
      'tests/e2e/legacyButton.spec.ts': "import { MDButton } from '@shared/ui/Button';\n",
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });

    expect(findings).toContainEqual(
      expect.objectContaining({
        code: CODES.MATERIAL_STALE_LEGACY_REFERENCE,
        path: 'tests/e2e/legacyButton.spec.ts',
      }),
    );
  });
});

describe('deterministic ordering', () => {
  it('sorts findings by path, then code, then message', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/zeta/helper.ts': 'export const helper = 1;\n',
      'src/shared/ui/material/alpha/helper.ts': 'export const helper = 1;\n',
    });
    const findings = validateMaterialLibrary({ repoRoot: root, baseRef: null });
    const sorted = [...findings].sort(
      (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
    );

    expect(findings.map((item) => item.path)).toEqual(sorted.map((item) => item.path));
  });
});

describe('formatFinding', () => {
  it('formats the required [static-blocking][<CODE>] <path>: block', () => {
    const output = formatFinding({
      code: 'MATERIAL_UNKNOWN_NAMESPACE',
      path: 'src/shared/ui/material/utils',
      message: 'Unknown namespace.',
    });

    expect(output).toBe(
      '[static-blocking][MATERIAL_UNKNOWN_NAMESPACE] src/shared/ui/material/utils:\nUnknown namespace.',
    );
  });
});

describe('getFilesAtRef', () => {
  it('returns null when the ref cannot be resolved', () => {
    expect(
      getFilesAtRef('nonexistent-ref', {
        repoRoot: '/tmp',
        spawn: () => ({ status: 128, stdout: '' }),
      }),
    ).toBeNull();
  });

  it('returns the file set reported by git', () => {
    const result = getFilesAtRef('HEAD', {
      repoRoot: '/tmp',
      spawn: () => ({ status: 0, stdout: 'a.ts\nb/c.ts\n' }),
    });

    expect(result).toEqual(new Set(['a.ts', 'b/c.ts']));
  });
});

describe('CLI behavior', () => {
  it('exits 0 for a valid repository', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
    });
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: root, encoding: 'utf8' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('0 architecture findings');
  });

  it('exits 1 and reports findings without an unhandled stack trace', () => {
    const root = tempRepo({
      'src/shared/ui/material/README.md': '# Material library\n',
      'src/shared/ui/material/utils/helper.ts': 'export const helper = 1;\n',
    });
    const result = spawnSync('node', [SCRIPT_PATH], { cwd: root, encoding: 'utf8' });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('[static-blocking][MATERIAL_UNKNOWN_NAMESPACE]');
    expect(result.stderr).toBe('');
    expect(result.stdout).not.toContain(' at ');
  });
});
