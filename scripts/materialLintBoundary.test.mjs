import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Linter } from 'eslint';
import { afterEach, describe, expect, it } from 'vitest';

// This file proves the effective Material lint boundary by executing the
// real configured rules, not by inspecting configuration JSON/JS:
// - static import/export boundaries run through the real oxlint binary
//   against the repository's actual `.oxlintrc.json` (see `lint()` below);
// - dynamic `import()` boundaries live in real ESLint's `no-restricted-syntax`
//   (oxlint has no equivalent rule), so they run through ESLint's `Linter`
//   API using the exact rule value read from the repository's actual
//   `eslint.config.mjs`, extracted via a plain Node subprocess in
//   `materialLintBoundary.testUtils.mjs` (see `lintDynamicImport()` below).

const REPO_ROOT = process.cwd();
const OXLINT_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/oxlint');
const REAL_CONFIG = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, '.oxlintrc.json'), 'utf8'));

const dynamicImportRulesResult = spawnSync(
  'node',
  [path.resolve(REPO_ROOT, 'scripts/materialLintBoundary.testUtils.mjs')],
  { cwd: REPO_ROOT, encoding: 'utf8' },
);

if (dynamicImportRulesResult.status !== 0) {
  throw new Error(
    `Failed to read real dynamic-import rules from eslint.config.mjs: ${dynamicImportRulesResult.stderr}`,
  );
}

const REAL_DYNAMIC_IMPORT_RULES = JSON.parse(dynamicImportRulesResult.stdout);

const tempRoots = [];

/**
 * Build a fixture-local oxlint config from the repository's real
 * `.oxlintrc.json`, so the test proves the actual merged overrides rather
 * than a hand-copied approximation. Type-aware analysis is disabled because
 * it requires a full TypeScript project the fixture does not provide and is
 * unrelated to the import-boundary rules under test.
 * @returns The fixture oxlint config object.
 */
function fixtureConfig() {
  return {
    ...REAL_CONFIG,
    options: { ...REAL_CONFIG.options, typeAware: false },
  };
}

function fixtureRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-lint-boundary-'));
  fs.writeFileSync(path.join(root, '.oxlintrc.json'), JSON.stringify(fixtureConfig()), 'utf8');

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

/**
 * Lint a single dynamic `import(specifier)` expression through the real
 * ESLint `Linter`, using the exact `no-restricted-syntax` rule value
 * configured for `blockName` in the repository's real `eslint.config.mjs`.
 * Oxlint has no equivalent rule, so dynamic-import boundaries are proven
 * this way instead of through the oxlint binary.
 * @param blockName The owning flat-config block's `name` field.
 * @param specifier The dynamic-import specifier to lint.
 * @returns ESLint lint messages for the fixture.
 */
function lintDynamicImport(blockName, specifier) {
  const ruleValue = REAL_DYNAMIC_IMPORT_RULES[blockName];

  if (!ruleValue) {
    throw new Error(`No real "no-restricted-syntax" rule value was read for "${blockName}".`);
  }

  const linter = new Linter();
  const code = `function load() {\n  return import(${JSON.stringify(specifier)});\n}\n`;

  return linter.verify(
    code,
    { rules: { 'no-restricted-syntax': ruleValue } },
    { filename: 'fixture.mjs' },
  );
}

describe('effective Material lint boundary (.oxlintrc.json, run through real oxlint)', () => {
  it('rejects Material code importing a product layer through an alias', () => {
    const root = fixtureRepo({
      'src/shared/ui/material/components/button/MDButton.vue':
        vueImporting('@feature/exampleAction'),
    });

    const result = lint(root);

    expect(result.status).not.toBe(0);
    expect(result.stdout).toContain('no-restricted-imports');
  });

  it('rejects Material code importing a product layer through a relative path', () => {
    const root = fixtureRepo({
      'src/shared/ui/material/components/button/MDButton.vue': vueImporting(
        '../../../../../features/exampleAction',
      ),
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
    ['../../../../../widgets/exampleWidget', 'relative path'],
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

describe('effective Material dynamic-import boundary (eslint.config.mjs, run through real ESLint)', () => {
  it.each(['@feature/exampleAction', '../../../../../features/exampleAction'])(
    'rejects Material code dynamically importing a product layer (%s)',
    (specifier) => {
      const messages = lintDynamicImport(
        'app/material-no-dynamic-product-layer-imports',
        specifier,
      );

      expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
    },
  );

  it('accepts Material code dynamically importing generic shared/lib infrastructure', () => {
    const messages = lintDynamicImport(
      'app/material-no-dynamic-product-layer-imports',
      '../../../../lib/features/helper',
    );

    expect(messages).toEqual([]);
  });

  it('rejects product code dynamically deep-importing Material internals', () => {
    const messages = lintDynamicImport(
      'app/no-dynamic-deep-material-imports',
      '@shared/ui/material/components/button/MDButton.vue',
    );

    expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
  });

  it('accepts product code dynamically importing the Material public root entry point', () => {
    const messages = lintDynamicImport(
      'app/no-dynamic-deep-material-imports',
      '@shared/ui/material',
    );

    expect(messages).toEqual([]);
  });

  it('rejects generic shared/lib dynamically importing the Material public root entry point', () => {
    const messages = lintDynamicImport(
      'app/shared-lib-no-dynamic-material-imports',
      '@shared/ui/material',
    );

    expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
  });

  it('rejects generic shared/lib dynamically deep-importing Material internals', () => {
    const messages = lintDynamicImport(
      'app/shared-lib-no-dynamic-material-imports',
      '@shared/ui/material/components/button/MDButton.vue',
    );

    expect(messages.some((item) => item.ruleId === 'no-restricted-syntax')).toBe(true);
  });

  it('leaves an unrelated dynamic import untouched', () => {
    const messages = lintDynamicImport(
      'app/material-no-dynamic-product-layer-imports',
      'some-package/features/helper',
    );

    expect(messages).toEqual([]);
  });
});
