import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHARED_ROOT = path.join(ROOT, 'src', 'shared');
const MATERIAL_PREFIX = 'src/shared/ui/material/';

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativePath(filePath) {
  return normalizePath(path.relative(ROOT, filePath));
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
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function extractStyleSources(filePath) {
  const file = relativePath(filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.endsWith('.css')) {
    return [{ file, source: content }];
  }

  if (!filePath.endsWith('.vue')) {
    return [];
  }

  const sources = [];
  const stylePattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;
  let index = 0;

  while ((match = stylePattern.exec(content))) {
    const attributes = match[1] ?? '';
    const source = match[2] ?? '';
    const language = attributes.match(/\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase();

    if (/\bsrc\s*=/i.test(attributes) || (language && !['css', 'postcss'].includes(language))) {
      continue;
    }

    index += 1;
    sources.push({ file: `${file}#style-${index}`, source });
  }

  return sources;
}

function baseFile(sourceFile) {
  return sourceFile.split('#')[0];
}

function isCanonicalMaterialFile(sourceFile) {
  return baseFile(sourceFile).startsWith(MATERIAL_PREFIX);
}

function isTokenFile(sourceFile) {
  return baseFile(sourceFile).endsWith('.tokens.css');
}

function componentFamily(sourceFile) {
  return baseFile(sourceFile).match(/^src\/shared\/ui\/material\/components\/([^/]+)\//)?.[1];
}

function isFoundationFile(sourceFile) {
  return baseFile(sourceFile).startsWith('src/shared/ui/material/foundation/');
}

function classifyCustomProperty(name) {
  if (name.startsWith('--md-ref-')) {
    return 'md-ref';
  }
  if (name.startsWith('--md-sys-')) {
    return 'md-sys';
  }
  if (name.startsWith('--md-comp-')) {
    return 'md-comp';
  }
  if (name.startsWith('--mio-sys-')) {
    return 'mio-sys';
  }
  if (name.startsWith('--mio-comp-')) {
    return 'mio-comp';
  }
  if (name.startsWith('--md-private-')) {
    return 'private';
  }
  if (name.startsWith('--md-')) {
    return 'invalid-md';
  }
  if (name.startsWith('--mio-')) {
    return 'invalid-mio';
  }
  return 'other';
}

function findClosingParenthesis(value, openIndex) {
  let depth = 0;

  for (let index = openIndex; index < value.length; index += 1) {
    if (value[index] === '(') {
      depth += 1;
    } else if (value[index] === ')') {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function hasTopLevelFallback(value, startIndex, endIndex) {
  let depth = 1;

  for (let index = startIndex; index < endIndex; index += 1) {
    if (value[index] === '(') {
      depth += 1;
    } else if (value[index] === ')') {
      depth -= 1;
    } else if (value[index] === ',' && depth === 1) {
      return true;
    }
  }

  return false;
}

function extractVarReferences(value) {
  const references = [];
  const pattern = /var\(\s*(--[a-zA-Z0-9_-]+)/g;
  let match;

  while ((match = pattern.exec(value))) {
    const openIndex = value.indexOf('(', match.index);
    const endIndex = findClosingParenthesis(value, openIndex);
    const nameEnd = match.index + match[0].length;

    references.push({
      name: match[1],
      hasFallback: endIndex === -1 ? false : hasTopLevelFallback(value, nameEnd, endIndex),
    });
  }

  return references;
}

function location(file, declaration) {
  const line = declaration.source?.start?.line;
  return line ? `${file}:${line}` : file;
}

function allowedDependency(sourceType, targetType) {
  const allowed = {
    'md-ref': new Set(['md-ref']),
    'md-sys': new Set(['md-ref', 'md-sys']),
    'mio-sys': new Set(['md-ref', 'md-sys', 'mio-sys']),
    'md-comp': new Set(['md-ref', 'md-sys', 'md-comp']),
    'mio-comp': new Set(['md-ref', 'md-sys', 'md-comp', 'mio-sys', 'mio-comp']),
    private: new Set(['md-ref', 'md-sys', 'md-comp', 'mio-sys', 'mio-comp', 'private']),
  };

  return allowed[sourceType]?.has(targetType) ?? false;
}

function analyzeStyleSources(styleSources) {
  const errors = [];
  const declarations = new Map();
  const references = [];
  const canonicalDeclarations = [];

  for (const styleSource of styleSources) {
    let root;

    try {
      root = postcss.parse(styleSource.source, { from: styleSource.file });
    } catch (error) {
      if (isCanonicalMaterialFile(styleSource.file)) {
        errors.push(`${styleSource.file}: invalid CSS syntax: ${error.message}`);
      }
      continue;
    }

    root.walkDecls((declaration) => {
      const declarationLocation = location(styleSource.file, declaration);
      const ownerToken = declaration.prop.startsWith('--') ? declaration.prop : null;
      const declarationReferences = extractVarReferences(declaration.value);

      for (const reference of declarationReferences) {
        references.push({
          ...reference,
          file: styleSource.file,
          location: declarationLocation,
          ownerToken,
        });
      }

      if (isCanonicalMaterialFile(styleSource.file) && isTokenFile(styleSource.file)) {
        if (!ownerToken) {
          errors.push(
            `${declarationLocation}: token files may contain custom-property declarations only; found '${declaration.prop}'`,
          );
        }
      }

      if (!ownerToken) {
        return;
      }

      const record = {
        name: ownerToken,
        type: classifyCustomProperty(ownerToken),
        value: declaration.value,
        references: declarationReferences,
        file: styleSource.file,
        location: declarationLocation,
        canonical: isCanonicalMaterialFile(styleSource.file),
      };

      const existing = declarations.get(ownerToken) ?? [];
      existing.push(record);
      declarations.set(ownerToken, existing);

      if (record.canonical) {
        canonicalDeclarations.push(record);
      }
    });
  }

  for (const declaration of canonicalDeclarations) {
    const { name, type, file } = declaration;
    const tokenFile = isTokenFile(file);
    const family = componentFamily(file);

    if (!/^--(?:md|mio)-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) {
      errors.push(`${declaration.location}: invalid Material custom-property syntax '${name}'`);
    }

    if (!declaration.value.trim()) {
      errors.push(`${declaration.location}: '${name}' has an empty value`);
    }

    if (['invalid-md', 'invalid-mio', 'other'].includes(type)) {
      errors.push(
        `${declaration.location}: '${name}' is not an allowed official, Mioframe, or private namespace`,
      );
      continue;
    }

    if (['md-ref', 'md-sys', 'mio-sys'].includes(type)) {
      if (!isFoundationFile(file) || !tokenFile) {
        errors.push(
          `${declaration.location}: '${name}' must be declared in a foundation *.tokens.css owner`,
        );
      }
    }

    if (['md-comp', 'mio-comp'].includes(type)) {
      if (!family || !tokenFile) {
        errors.push(
          `${declaration.location}: '${name}' must be declared in the owning component family *.tokens.css file`,
        );
      } else {
        const expectedPrefix =
          type === 'md-comp' ? `--md-comp-${family}-` : `--mio-comp-${family}-`;
        if (!name.startsWith(expectedPrefix)) {
          errors.push(
            `${declaration.location}: '${name}' does not match owning family '${family}'`,
          );
        }
      }
    }

    if (type === 'private' && tokenFile) {
      errors.push(`${declaration.location}: private route '${name}' must not live in a token file`);
    }

    for (const reference of declaration.references) {
      const targetType = classifyCustomProperty(reference.name);

      if (targetType === 'other') {
        continue;
      }

      if (['invalid-md', 'invalid-mio'].includes(targetType)) {
        errors.push(
          `${declaration.location}: '${name}' depends on invalid alias '${reference.name}'`,
        );
        continue;
      }

      if (!allowedDependency(type, targetType)) {
        errors.push(
          `${declaration.location}: forbidden dependency ${name} (${type}) → ${reference.name} (${targetType})`,
        );
      }

      if (family && ['md-comp', 'mio-comp'].includes(targetType)) {
        const allowedPrefixes = [`--md-comp-${family}-`, `--mio-comp-${family}-`];
        if (!allowedPrefixes.some((prefix) => reference.name.startsWith(prefix))) {
          errors.push(
            `${declaration.location}: cross-family component-token dependency '${reference.name}'`,
          );
        }
      }
    }
  }

  for (const [name, records] of declarations) {
    const canonicalRecords = records.filter((record) => record.canonical);
    const type = classifyCustomProperty(name);

    if (['md-comp', 'mio-comp'].includes(type) && canonicalRecords.length > 1) {
      errors.push(
        `${name}: duplicate canonical component-token declarations at ${canonicalRecords
          .map((record) => record.location)
          .join(', ')}`,
      );
    }

    if (['md-comp', 'mio-comp'].includes(type) && canonicalRecords.length === 1) {
      const useCount = references.filter(
        (reference) => reference.name === name && reference.ownerToken !== name,
      ).length;
      if (useCount === 0) {
        errors.push(`${canonicalRecords[0].location}: dead component token '${name}'`);
      }
    }
  }

  for (const reference of references.filter((entry) => isCanonicalMaterialFile(entry.file))) {
    const type = classifyCustomProperty(reference.name);
    const requiredOfficial = ['md-ref', 'md-sys', 'md-comp'].includes(type);
    const requiredWithoutFallback =
      ['mio-sys', 'mio-comp', 'private'].includes(type) && !reference.hasFallback;

    if ((requiredOfficial || requiredWithoutFallback) && !declarations.has(reference.name)) {
      errors.push(`${reference.location}: unresolved required token '${reference.name}'`);
    }
  }

  const graph = new Map();
  const canonicalNames = new Set(canonicalDeclarations.map((declaration) => declaration.name));

  for (const declaration of canonicalDeclarations) {
    const edges = graph.get(declaration.name) ?? new Set();
    for (const reference of declaration.references) {
      if (canonicalNames.has(reference.name)) {
        edges.add(reference.name);
      }
    }
    graph.set(declaration.name, edges);
  }

  const visiting = new Set();
  const visited = new Set();
  const stack = [];

  function visit(name) {
    if (visiting.has(name)) {
      const cycleStart = stack.indexOf(name);
      errors.push(`circular token dependency: ${[...stack.slice(cycleStart), name].join(' → ')}`);
      return;
    }
    if (visited.has(name)) {
      return;
    }

    visiting.add(name);
    stack.push(name);
    for (const target of graph.get(name) ?? []) {
      visit(target);
    }
    stack.pop();
    visiting.delete(name);
    visited.add(name);
  }

  for (const name of graph.keys()) {
    visit(name);
  }

  return [...new Set(errors)].sort();
}

function repositoryStyleSources() {
  return walkFiles(SHARED_ROOT).flatMap(extractStyleSources);
}

describe('Material token architecture', () => {
  it('accepts the minimal directed token route', () => {
    const errors = analyzeStyleSources([
      {
        file: 'src/shared/ui/material/foundation/tokens/system.tokens.css',
        source: ':root { --md-sys-color-primary: red; }',
      },
      {
        file: 'src/shared/ui/material/components/button/button.tokens.css',
        source:
          '.md-button { --md-comp-button-filled-container-color: var(--md-sys-color-primary); }',
      },
      {
        file: 'src/shared/ui/material/components/button/MDButton.css',
        source:
          '.md-button { --md-private-button-container-color: var(--md-comp-button-filled-container-color); background-color: var(--md-private-button-container-color); }',
      },
    ]);

    expect(errors).toEqual([]);
  });

  it('rejects ambiguous aliases, cycles, and dead component tokens', () => {
    const errors = analyzeStyleSources([
      {
        file: 'src/shared/ui/material/components/button/button.tokens.css',
        source: `
          .md-button {
            --md-comp-button-a: var(--md-comp-button-b);
            --md-comp-button-b: var(--md-comp-button-a);
            --md-comp-button-unused: 10px;
          }
        `,
      },
      {
        file: 'src/shared/ui/material/components/button/MDButton.css',
        source: '.md-button { --md-button-radius: 10px; border-radius: var(--md-comp-button-a); }',
      },
    ]);

    expect(errors.some((error) => error.includes('--md-button-radius'))).toBe(true);
    expect(errors.some((error) => error.includes('circular token dependency'))).toBe(true);
    expect(
      errors.some((error) => error.includes("dead component token '--md-comp-button-unused'")),
    ).toBe(true);
  });

  it('keeps the repository token graph valid', () => {
    expect(analyzeStyleSources(repositoryStyleSources())).toEqual([]);
  });
});
