import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { afterEach, describe, expect, it } from 'vitest';

const REPO_ROOT = process.cwd();
const OXLINT_BIN = path.resolve(REPO_ROOT, 'node_modules/.bin/oxlint');
const REAL_CONFIG = JSON.parse(fs.readFileSync(path.resolve(REPO_ROOT, '.oxlintrc.json'), 'utf8'));

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

  it('accepts Material code importing generic shared/lib infrastructure', () => {
    const root = fixtureRepo({
      'src/shared/lib/cache/index.ts': 'export const cache = new Map();\n',
      'src/shared/ui/material/components/button/MDButton.vue':
        vueImporting('../../../../lib/cache'),
    });

    const result = lint(root);

    expect(result.status).toBe(0);
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
