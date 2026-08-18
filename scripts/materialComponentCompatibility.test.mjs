import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { resolveMaterialComponentCompatibility } from './materialComponentCompatibility.mjs';

const tempDirs = [];

afterEach(() => {
  for (const directory of tempDirs) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  tempDirs.length = 0;
});

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-compat-'));
  tempDirs.push(root);
  return root;
}

function write(root, relativePath, content) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

function kebabCase(family) {
  return family.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

function tokenNameFor(family) {
  return `--md-comp-${kebabCase(family)}-container-color`;
}

function createFamily(root, family = 'exampleAction') {
  const base = `src/shared/ui/material/components/${family}`;
  const token = tokenNameFor(family);

  write(
    root,
    `${base}/contract.ts`,
    `export interface MDExampleActionSlots {\n  default(): unknown;\n  icon?(): unknown;\n}\n`,
  );
  write(root, `${base}/tokens.css`, `:root {\n  ${token}: var(--md-sys-color-primary);\n}\n`);
  write(root, `${base}/BEHAVIOR.md`, '# Behavior\n');
  write(
    root,
    `${base}/MDExampleAction.vue`,
    `<script setup lang="ts">\nimport './tokens.css';\nconst size = 'small';\n</script>\n<template><div /></template>\n<style scoped>\n.md-example-action {\n  --m3e-example-color: var(${token});\n}\n</style>\n`,
  );

  return base;
}

describe('material component compatibility resolver', () => {
  it('accepts a structurally reusable family with public defaults on :root loaded unscoped', () => {
    const root = createRoot();
    createFamily(root);

    expect(resolveMaterialComponentCompatibility(root, 'exampleAction')).toEqual({
      version: 1,
      family: 'exampleAction',
      status: 'clean',
      owner: null,
      violations: [],
    });
  });

  it('routes old slot syntax to API before later token violations', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/contract.ts`,
      `export interface MDExampleActionSlots {\n  default: () => unknown;\n}\n`,
    );
    write(
      root,
      `${base}/tokens.css`,
      `.md-example-action { ${tokenNameFor('exampleAction')}: red; }\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('api-contract');
    expect(result.violations.map((violation) => violation.rule)).toContain(
      'slot-property-signature',
    );
  });

  it('routes a family-owned public default declared on a local selector to token-contract', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/tokens.css`,
      `.md-example-action {\n  ${tokenNameFor('exampleAction')}: var(--md-sys-color-primary);\n}\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('token-contract');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'component-token-outside-root',
    ]);
  });

  it('routes private --m3e-* tokens inside the public tokens.css to token-contract', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/tokens.css`,
      `:root {\n  ${tokenNameFor('exampleAction')}: red;\n  --m3e-private: blue;\n}\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('token-contract');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'private-renderer-token-in-public-catalogue',
    ]);
  });

  it('routes duplicate public defaults declared across two family tokens.css files to token-contract', () => {
    const root = createRoot();
    createFamily(root, 'exampleAction');
    const otherBase = createFamily(root, 'otherAction');
    write(
      root,
      `${otherBase}/tokens.css`,
      `:root {\n  ${tokenNameFor('exampleAction')}: var(--md-sys-color-primary);\n}\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('token-contract');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'duplicate-public-default',
    ]);
  });

  it('does not treat a contextual --md-comp-* override in a composer implementation CSS as duplicate default ownership', () => {
    const root = createRoot();
    createFamily(root, 'exampleAction');
    const composerBase = createFamily(root, 'composerAction');
    write(
      root,
      `${composerBase}/MDComposerAction.vue`,
      `<script setup lang="ts">\nimport './tokens.css';\n</script>\n<template><div /></template>\n<style scoped>\n.md-composer-action__nested {\n  ${tokenNameFor('exampleAction')}: currentColor;\n}\n</style>\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result).toEqual({
      version: 1,
      family: 'exampleAction',
      status: 'clean',
      owner: null,
      violations: [],
    });
  });

  it('routes tokens.css loaded through a scoped Vue style block to implementation', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/MDExampleAction.vue`,
      `<script setup lang="ts">\nconst size = 'small';\n</script>\n<template><div /></template>\n<style scoped>\n@import './tokens.css';\n\n.md-example-action {\n  vertical-align: middle;\n}\n</style>\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('implementation');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'scoped-token-contract-load',
    ]);
  });

  it('accepts an unscoped family token import', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/MDExampleAction.vue`,
      `<script setup lang="ts">\nimport './tokens.css';\n</script>\n<template><div /></template>\n<style scoped>\n.md-example-action {\n  vertical-align: middle;\n}\n</style>\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result).toEqual({
      version: 1,
      family: 'exampleAction',
      status: 'clean',
      owner: null,
      violations: [],
    });
  });

  it('allows CSS token bridges but routes runtime token mapping to implementation', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/MDExampleAction.vue`,
      `<script setup lang="ts">\nimport './tokens.css';\nconst rendererToken = (suffix: string) => \`--m3e-example-\${suffix}\`;\n</script>\n<template><div /></template>\n<style scoped>\n.md-example-action {\n  --m3e-example-color: var(${tokenNameFor('exampleAction')});\n}\n</style>\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('implementation');
    expect(result.violations.map((violation) => violation.rule)).toEqual(['runtime-token-mapping']);
  });

  it('routes a new family to the API contract', () => {
    const root = createRoot();

    const result = resolveMaterialComponentCompatibility(root, 'newFamily');

    expect(result.owner).toBe('api-contract');
    expect(result.violations.map((violation) => violation.rule)).toEqual(['missing-contract']);
  });

  it('rejects path-like family names', () => {
    const root = createRoot();

    expect(() => resolveMaterialComponentCompatibility(root, '../exampleAction')).toThrow(
      'Invalid Material family name',
    );
  });
});
