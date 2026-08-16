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

function createFamily(root, family = 'exampleAction') {
  const base = `src/shared/ui/material/components/${family}`;

  write(
    root,
    `${base}/contract.ts`,
    `export interface MDExampleActionSlots {\n  default(): unknown;\n  icon?(): unknown;\n}\n`,
  );
  write(
    root,
    `${base}/tokens.css`,
    `.md-example-action {\n  --md-comp-example-action-container-color: var(--md-sys-color-primary);\n}\n`,
  );
  write(root, `${base}/BEHAVIOR.md`, '# Behavior\n');
  write(
    root,
    `${base}/MDExampleAction.vue`,
    `<script setup lang="ts">\nconst size = 'small';\n</script>\n<template><div /></template>\n<style scoped>\n.md-example-action {\n  --m3e-example-color: var(--md-comp-example-action-container-color);\n}\n</style>\n`,
  );

  return base;
}

describe('material component compatibility resolver', () => {
  it('accepts a structurally reusable family', () => {
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
    write(root, `${base}/tokens.css`, ':root { --md-comp-example-action-color: red; }\n');

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('api-contract');
    expect(result.violations.map((violation) => violation.rule)).toContain(
      'slot-property-signature',
    );
  });

  it('consolidates public token ownership violations under the token owner', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/tokens.css`,
      ':root {\n  --md-comp-example-action-color: red;\n  --m3e-private: blue;\n}\n',
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('token-contract');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'component-tokens-on-root',
      'private-renderer-token-in-public-catalogue',
    ]);
  });

  it('allows CSS token bridges but routes runtime token mapping to implementation', () => {
    const root = createRoot();
    const base = createFamily(root);
    write(
      root,
      `${base}/MDExampleAction.vue`,
      `<script setup lang="ts">\nconst rendererToken = (suffix: string) => \`--m3e-example-\${suffix}\`;\n</script>\n<template><div /></template>\n<style scoped>\n.md-example-action {\n  --m3e-example-color: var(--md-comp-example-action-container-color);\n}\n</style>\n`,
    );

    const result = resolveMaterialComponentCompatibility(root, 'exampleAction');

    expect(result.owner).toBe('implementation');
    expect(result.violations.map((violation) => violation.rule)).toEqual([
      'runtime-token-mapping',
    ]);
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
