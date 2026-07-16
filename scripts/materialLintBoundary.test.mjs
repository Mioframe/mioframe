import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

// This file proves the effective Material lint boundary by executing the
// real configured rules, not by inspecting configuration JSON/JS:
// - static import/export boundaries run through the real oxlint binary
//   against the repository's actual `.oxlintrc.json` (see `lint()` below);
// - dynamic `import()` boundaries live in a small local ESLint rule
//   (`local/no-restricted-dynamic-imports`, see
//   `scripts/lib/noRestrictedDynamicImportsRule.mjs`), so they run through
//   the real `eslint` binary against real on-disk fixture files under `src`,
//   which proves the actual merged flat configuration for a representative
//   path (including that it coexists with the unrelated `no-restricted-
//   syntax` DOM-communication restrictions) rather than an extracted rule
//   value. Real on-disk files are required, not virtual/stdin content,
//   because the repository's type-aware ESLint config needs the file to be
//   part of the TypeScript project. A separate `eslint` process per fixture
//   is required too: typescript-eslint's project service caches project
//   membership at the process level, so reusing one process (or one
//   in-process `ESLint` instance) across fixtures in different directories
//   produces spurious "not part of the project" errors for later fixtures.

const REPO_ROOT = process.cwd();
const OXLINT_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/oxlint');
const ESLINT_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/eslint');
const REAL_OXLINT_CONFIG = JSON.parse(
  fs.readFileSync(path.resolve(REPO_ROOT, '.oxlintrc.json'), 'utf8'),
);

const tempRoots = [];

/**
 * Build a fixture-local oxlint config from the repository's real
 * `.oxlintrc.json`, so the test proves the actual merged overrides rather
 * than a hand-copied approximation. Type-aware analysis is disabled because
 * it requires a full TypeScript project the fixture does not provide and is
 * unrelated to the import-boundary rules under test.
 * @returns The fixture oxlint config object.
 */
function fixtureOxlintConfig() {
  return {
    ...REAL_OXLINT_CONFIG,
    options: { ...REAL_OXLINT_CONFIG.options, typeAware: false },
  };
}

function fixtureRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-lint-boundary-'));
  fs.writeFileSync(
    path.join(root, '.oxlintrc.json'),
    JSON.stringify(fixtureOxlintConfig()),
    'utf8',
  );

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(root, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  tempRoots.push(root);
  return root;
}

afterEach(() => {
  while (tempRoots.length > 0) {
    fs.rmSync(tempRoots.pop(), { recursive: true, force: true });
  }
});

function vueImporting(specifier) {
  return [
    '<script setup lang="ts">',
    `import value from '${specifier}';`,
    'console.log(value);',
    '</script>',
    '<template><div /></template>',
    '',
  ].join('\n');
}

function lint(root) {
  return spawnSync(OXLINT_BIN, ['-c', '.oxlintrc.json', 'src'], { cwd: root, encoding: 'utf8' });
}

describe('effective Material static import boundary (.oxlintrc.json, run through real oxlint)', () => {
  it('rejects Material code importing a product layer through an alias', () => {
    const root = fixtureRepo({
      'src/shared/ui/material/components/button/MDButton.vue':
        vueImporting('@feature/exampleAction'),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('rejects Material code importing a bare root-alias product layer, not only a deep path', () => {
    const root = fixtureRepo({
      'src/shared/ui/material/components/button/MDButton.vue': vueImporting('@/features'),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it.each([
    ['@entity/exampleEntity', 'alias'],
    ['@/pages', 'bare root alias'],
  ])('rejects Material code importing the %s product layer form (%s)', (specifier) => {
    const root = fixtureRepo({
      'src/shared/ui/material/components/button/MDButton.vue': vueImporting(specifier),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it.each([
    ['@shared/lib/features/helper', 'a @shared/lib path that merely contains a layer name'],
    [
      '../../../../lib/features/helper',
      'a relative shared/lib path that merely contains a layer name',
    ],
    ['some-package/features/helper', 'an unrelated package path that merely contains a layer name'],
    ['../features/helper', 'an unresolved relative path that merely contains a layer name'],
  ])('accepts Material code importing %s (%s)', (specifier) => {
    const root = fixtureRepo({
      'src/shared/lib/features/helper.ts': 'export const helper = 1;\n',
      'src/shared/ui/material/components/button/MDButton.vue': vueImporting(specifier),
    });

    const result = lint(root);

    expect(result.status).toBe(0);
  });

  it('accepts Material code importing generic shared/lib infrastructure', () => {
    const root = fixtureRepo({
      'src/shared/lib/cache/index.ts': 'export const cache = new Map();\n',
      'src/shared/ui/material/components/button/MDButton.vue':
        vueImporting('../../../../lib/cache'),
    });

    const result = lint(root);

    expect(result.status).toBe(0);
  });

  it('rejects generic shared/lib importing the Material public root entry point', () => {
    const root = fixtureRepo({
      'src/shared/lib/cache/index.ts':
        "import value from '@shared/ui/material';\nconsole.log(value);\n",
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('rejects generic shared/lib deep-importing Material internals', () => {
    const root = fixtureRepo({
      'src/shared/lib/cache/index.ts':
        "import value from '@shared/ui/material/components/button/MDButton';\nconsole.log(value);\n",
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('rejects product code deep-importing Material internals', () => {
    const root = fixtureRepo({
      'src/features/exampleAction/ExampleAction.vue': vueImporting(
        '@shared/ui/material/components/button/MDButton',
      ),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('accepts product code importing the Material public root entry point when it exists', () => {
    const root = fixtureRepo({
      'src/shared/ui/material/index.ts':
        "export { default as MDButton } from './components/button/MDButton.vue';\n",
      'src/features/exampleAction/ExampleAction.vue': vueImporting('@shared/ui/material'),
    });

    const result = lint(root);

    expect(result.status).toBe(0);
  });

  it('rejects product code deep-importing @shared/service internals', () => {
    const root = fixtureRepo({
      'src/features/exampleAction/ExampleAction.vue': vueImporting(
        '@shared/service/internalHelper',
      ),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('accepts product code importing from @shared/service', () => {
    const root = fixtureRepo({
      'src/features/exampleAction/ExampleAction.vue': vueImporting('@shared/service'),
    });

    const result = lint(root);

    expect(result.status).toBe(0);
  });
});

// ---- effective ESLint dynamic-import boundary, run against real files ----

const MATERIAL_FIXTURE_DIR = 'src/shared/ui/material/components/__materialLintBoundaryFixture__';
const FEATURE_FIXTURE_DIR = 'src/features/__materialLintBoundaryFixture__';
const SHARED_LIB_FIXTURE_DIR = 'src/shared/lib/__materialLintBoundaryFixture__';
const DYNAMIC_IMPORT_FIXTURE_ROOTS = [
  MATERIAL_FIXTURE_DIR,
  FEATURE_FIXTURE_DIR,
  SHARED_LIB_FIXTURE_DIR,
];
// Parent directory each fixture root must not remove: material-static
// validation rejects `src/shared/ui/material/components` as an empty
// speculative directory, so cleanup must also remove that intermediate
// directory if writing the fixture created it, but must stop before this
// boundary, which is real, permanently non-empty repository content.
const DYNAMIC_IMPORT_FIXTURE_BOUNDARIES = {
  [MATERIAL_FIXTURE_DIR]: 'src/shared/ui/material',
  [FEATURE_FIXTURE_DIR]: 'src/features',
  [SHARED_LIB_FIXTURE_DIR]: 'src/shared/lib',
};

function removeFixtureRoot(relativeDir) {
  const absoluteDir = path.resolve(REPO_ROOT, relativeDir);
  fs.rmSync(absoluteDir, { recursive: true, force: true });

  const boundary = path.resolve(REPO_ROOT, DYNAMIC_IMPORT_FIXTURE_BOUNDARIES[relativeDir]);
  let current = path.dirname(absoluteDir);

  while (current !== boundary && fs.existsSync(current) && fs.readdirSync(current).length === 0) {
    fs.rmdirSync(current);
    current = path.dirname(current);
  }
}

function vueScript(lines) {
  return [
    '<script setup lang="ts">',
    ...lines,
    '</script>',
    '<template><div /></template>',
    '',
  ].join('\n');
}

function dynamicImportLines(specifier) {
  return ['async function load() {', `  return import('${specifier}');`, '}', 'void load();'];
}

const MATERIAL_BOTH_FAIL = `${MATERIAL_FIXTURE_DIR}/MDFixtureBothFail.vue`;
const MATERIAL_ALLOWED = `${MATERIAL_FIXTURE_DIR}/MDFixtureAllowed.vue`;
const FEATURE_BOTH_FAIL = `${FEATURE_FIXTURE_DIR}/FixtureActionBothFail.vue`;
const FEATURE_ALLOWED = `${FEATURE_FIXTURE_DIR}/FixtureActionAllowed.vue`;
const SHARED_LIB_BOTH_FAIL = `${SHARED_LIB_FIXTURE_DIR}/fixture.ts`;

const DYNAMIC_IMPORT_FIXTURES = {
  [MATERIAL_BOTH_FAIL]: vueScript([
    'const element = document.body;',
    "element.querySelector('.child');",
    '',
    ...dynamicImportLines('@feature/example'),
  ]),
  [MATERIAL_ALLOWED]: vueScript([
    'async function loadA() {',
    "  return import('../features/helper');",
    '}',
    'async function loadB() {',
    "  return import('some-package/features/helper');",
    '}',
    'async function loadC() {',
    "  return import('@shared/lib/features/helper');",
    '}',
    'void loadA();',
    'void loadB();',
    'void loadC();',
  ]),
  [FEATURE_BOTH_FAIL]: vueScript([
    'const element = document.body;',
    "const event = new Event('click');",
    'element.dispatchEvent(event);',
    '',
    ...dynamicImportLines('@shared/ui/material/components/button/MDButton.vue'),
  ]),
  [FEATURE_ALLOWED]: vueScript(dynamicImportLines('@shared/ui/material')),
  [SHARED_LIB_BOTH_FAIL]: [...dynamicImportLines('@shared/ui/material'), ''].join('\n'),
};

let dynamicImportMessagesByFile;

beforeAll(() => {
  for (const [relativeFilePath, content] of Object.entries(DYNAMIC_IMPORT_FIXTURES)) {
    const absolutePath = path.resolve(REPO_ROOT, relativeFilePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, 'utf8');
  }

  // One `eslint` process lints every fixture together, so the type-aware
  // TypeScript project is built once instead of once per fixture.
  const result = spawnSync(
    ESLINT_BIN,
    [...Object.keys(DYNAMIC_IMPORT_FIXTURES), '--no-ignore', '--format', 'json'],
    { cwd: REPO_ROOT, encoding: 'utf8' },
  );

  const results = JSON.parse(result.stdout);
  dynamicImportMessagesByFile = new Map(
    results.map((item) => [path.relative(REPO_ROOT, item.filePath), item.messages]),
  );
}, 30000);

afterAll(() => {
  for (const relativeDir of DYNAMIC_IMPORT_FIXTURE_ROOTS) {
    removeFixtureRoot(relativeDir);
  }
});

function messagesFor(relativeFilePath) {
  const messages = dynamicImportMessagesByFile.get(relativeFilePath);

  if (!messages) {
    throw new Error(`No lint result was captured for fixture "${relativeFilePath}".`);
  }

  return messages;
}

describe('effective Material dynamic-import boundary (eslint.config.mjs, run through real ESLint against real files)', () => {
  it('rejects a Material Vue file using dispatchEvent/querySelector and a dynamic product-layer import', () => {
    const messages = messagesFor(MATERIAL_BOTH_FAIL);

    expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(messages.some((item) => item.ruleId === 'local/no-restricted-dynamic-imports')).toBe(
      true,
    );
  });

  it('rejects a product-layer Vue file using dispatchEvent and a dynamic deep Material import', () => {
    const messages = messagesFor(FEATURE_BOTH_FAIL);

    expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
    expect(messages.some((item) => item.ruleId === 'local/no-restricted-dynamic-imports')).toBe(
      true,
    );
  });

  it('rejects a generic shared/lib file dynamically importing the Material public root entry point', () => {
    const messages = messagesFor(SHARED_LIB_BOTH_FAIL);

    expect(messages.some((item) => item.ruleId === 'local/no-restricted-dynamic-imports')).toBe(
      true,
    );
  });

  it('allows a product-layer Vue file dynamically importing the Material public root entry point', () => {
    const messages = messagesFor(FEATURE_ALLOWED);

    expect(messages.some((item) => item.ruleId === 'local/no-restricted-dynamic-imports')).toBe(
      false,
    );
  });

  it('allows a Material Vue file dynamically importing paths that merely contain a layer name or Material path segment', () => {
    const messages = messagesFor(MATERIAL_ALLOWED);

    expect(messages.some((item) => item.ruleId === 'local/no-restricted-dynamic-imports')).toBe(
      false,
    );
  });
});
