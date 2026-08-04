import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SOURCE_ROOT = resolve('src');
const MATERIAL_ROOT = resolve('src/shared/ui/material');
const RUNTIME_EXTENSIONS = new Set(['.css', '.vue', '.ts', '.mts', '.tsx']);

const collectRuntimeFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (path === MATERIAL_ROOT) return [];
    if (entry.isDirectory()) return collectRuntimeFiles(path);
    const extension = entry.name.slice(entry.name.lastIndexOf('.'));
    return RUNTIME_EXTENSIONS.has(extension) ? [path] : [];
  });

describe('private Material renderer boundary', () => {
  it('keeps --m3e-* runtime references inside src/shared/ui/material', () => {
    const violations = collectRuntimeFiles(SOURCE_ROOT)
      .filter((path) => readFileSync(path, 'utf8').includes('--m3e-'))
      .map((path) => relative('.', path))
      .sort();

    expect(violations).toEqual([]);
  });
});
