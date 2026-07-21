import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATERIAL_ROOT = path.join(ROOT, 'src', 'shared', 'ui', 'material');
const SHARED_UI_ROOT = path.join(ROOT, 'src', 'shared', 'ui');
const LEGACY_MD_ROOT = path.join(ROOT, 'src', 'shared', 'lib', 'md');
const SOURCE_EXTENSIONS = new Set(['.css', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.vue']);

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativePath(filePath) {
  return normalizePath(path.relative(ROOT, filePath));
}

function isInside(candidate, owner) {
  const relative = path.relative(owner, candidate);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...walkFiles(entryPath));
    } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

function extractSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /\b(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /@import\s+(?:url\(\s*)?['"]([^'"]+)['"]/g,
    /<style\b[^>]*\bsrc=['"]([^'"]+)['"][^>]*>/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content))) {
      specifiers.push(match[1]);
    }
  }

  return specifiers;
}

function classifyForbiddenImport(filePath, specifier) {
  if (specifier.startsWith('@shared/ui/')) {
    return 'canonical Material code must not import another @shared/ui owner; use a local Material owner or an allowed generic shared/lib contract';
  }

  if (specifier === '@shared/lib/md' || specifier.startsWith('@shared/lib/md/')) {
    return 'legacy @shared/lib/md is not a canonical Material foundation owner';
  }

  if (!specifier.startsWith('.')) {
    return null;
  }

  const resolved = path.resolve(path.dirname(filePath), specifier);

  if (isInside(resolved, SHARED_UI_ROOT) && !isInside(resolved, MATERIAL_ROOT)) {
    return 'relative import escapes the Material boundary into a legacy shared UI owner';
  }

  if (isInside(resolved, LEGACY_MD_ROOT)) {
    return 'relative import escapes the Material boundary into legacy shared/lib/md';
  }

  return null;
}

function analyzeFiles(files) {
  const errors = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');

    for (const specifier of extractSpecifiers(content)) {
      const reason = classifyForbiddenImport(filePath, specifier);
      if (reason) {
        errors.push(`${relativePath(filePath)}: forbidden '${specifier}': ${reason}`);
      }
    }
  }

  return [...new Set(errors)].sort();
}

describe('Material library boundary architecture', () => {
  it('detects legacy alias and relative owner imports', () => {
    const fixtureRoot = path.join(MATERIAL_ROOT, 'components', 'fixture');
    const fixturePath = path.join(fixtureRoot, 'Fixture.vue');
    const errors = analyzeFiles([
      {
        path: fixturePath,
        content: '',
      },
    ].map(({ path: filePath, content }) => {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(
        filePath,
        `${content}<script setup>\nimport { MDStateLayer } from '@shared/ui/State';\nimport { MD_TYPESCALE } from '@shared/lib/md';\nimport Legacy from '../../../State/Legacy.vue';\n</script>`,
      );
      return filePath;
    }));

    fs.rmSync(fixtureRoot, { recursive: true, force: true });

    expect(errors).toEqual([
      expect.stringContaining("forbidden '../../../State/Legacy.vue'"),
      expect.stringContaining("forbidden '@shared/lib/md'"),
      expect.stringContaining("forbidden '@shared/ui/State'"),
    ]);
  });

  it('keeps canonical Material source independent from legacy shared UI owners', () => {
    expect(analyzeFiles(walkFiles(MATERIAL_ROOT))).toEqual([]);
  });
});
