import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHARED_ROOT = path.join(ROOT, 'src', 'shared');
const MATERIAL_PREFIX = 'src/shared/ui/material/';

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
  });
}

function styleSources(filePath) {
  const file = normalize(path.relative(ROOT, filePath));
  const content = fs.readFileSync(filePath, 'utf8');

  if (filePath.endsWith('.css')) {
    return [{ file, source: content }];
  }
  if (!filePath.endsWith('.vue')) {
    return [];
  }

  const sources = [];
  const pattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;
  let index = 0;

  while ((match = pattern.exec(content))) {
    const attributes = match[1] ?? '';
    const language = attributes.match(/\blang=["']([^"']+)["']/i)?.[1]?.toLowerCase();
    if (/\bsrc\s*=/i.test(attributes) || (language && !['css', 'postcss'].includes(language))) {
      continue;
    }
    index += 1;
    sources.push({ file: `${file}#style-${index}`, source: match[2] ?? '' });
  }

  return sources;
}

function baseFile(file) {
  return file.split('#')[0];
}

function tokenType(name) {
  if (name.startsWith('--md-ref-')) return 'md-ref';
  if (name.startsWith('--md-sys-')) return 'md-sys';
  if (name.startsWith('--md-comp-')) return 'md-comp';
  return null;
}

function componentFamily(file) {
  return file.match(/^src\/shared\/ui\/material\/components\/([^/]+)\//)?.[1] ?? null;
}

function analyze(sources) {
  const declarations = new Map();
  const references = [];

  for (const { file, source } of sources) {
    let root;
    try {
      root = postcss.parse(source, { from: file });
    } catch {
      continue;
    }

    root.walkDecls((declaration) => {
      if (declaration.prop.startsWith('--')) {
        const records = declarations.get(declaration.prop) ?? [];
        records.push({ file: baseFile(file), line: declaration.source?.start?.line ?? 0 });
        declarations.set(declaration.prop, records);
      }

      for (const match of declaration.value.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)/g)) {
        if (tokenType(match[1])) {
          references.push({
            name: match[1],
            file: baseFile(file),
            line: declaration.source?.start?.line ?? 0,
          });
        }
      }
    });
  }

  const errors = [];
  for (const reference of references.filter((entry) => entry.file.startsWith(MATERIAL_PREFIX))) {
    const records = declarations.get(reference.name) ?? [];
    const canonical = records.filter((record) => record.file.startsWith(MATERIAL_PREFIX));
    const legacy = records.filter((record) => !record.file.startsWith(MATERIAL_PREFIX));

    if (canonical.length === 0) {
      errors.push(
        `${reference.file}:${reference.line}: canonical Material references '${reference.name}' without a canonical Material token owner`,
      );
      continue;
    }

    if (legacy.length > 0) {
      errors.push(
        `${reference.name}: active legacy declarations remain at ${legacy
          .map((record) => `${record.file}:${record.line}`)
          .join(', ')}`,
      );
    }

    const type = tokenType(reference.name);
    for (const record of canonical) {
      const tokenFile = record.file.endsWith('.tokens.css');
      if (['md-ref', 'md-sys'].includes(type)) {
        if (!record.file.startsWith(`${MATERIAL_PREFIX}foundation/`) || !tokenFile) {
          errors.push(
            `${record.file}:${record.line}: '${reference.name}' must be foundation-owned`,
          );
        }
      } else if (type === 'md-comp') {
        const family = componentFamily(record.file);
        if (!family || !reference.name.startsWith(`--md-comp-${family}-`) || !tokenFile) {
          errors.push(
            `${record.file}:${record.line}: '${reference.name}' must be owned by its component family`,
          );
        }
      }
    }
  }

  return [...new Set(errors)].sort();
}

function repositorySources() {
  return walkFiles(SHARED_ROOT).flatMap(styleSources);
}

describe('Canonical Material token ownership', () => {
  it('rejects canonical consumption backed only by a legacy declaration', () => {
    const errors = analyze([
      {
        file: 'src/shared/lib/md/tokens.css',
        source: ':root { --md-sys-color-primary: red; }',
      },
      {
        file: 'src/shared/ui/material/components/button/MDButton.css',
        source: '.md-button { color: var(--md-sys-color-primary); }',
      },
    ]);

    expect(errors).toEqual([expect.stringContaining('without a canonical Material token owner')]);
  });

  it('accepts singular canonical system and component owners', () => {
    expect(
      analyze([
        {
          file: 'src/shared/ui/material/foundation/color/color.tokens.css',
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
            '.md-button { color: var(--md-comp-button-filled-container-color); }',
        },
      ]),
    ).toEqual([]);
  });

  it('rejects a component token declared by the wrong family', () => {
    expect(
      analyze([
        {
          file: 'src/shared/ui/material/components/card/card.tokens.css',
          source: '.md-card { --md-comp-button-filled-container-color: red; }',
        },
        {
          file: 'src/shared/ui/material/components/button/MDButton.css',
          source: '.md-button { color: var(--md-comp-button-filled-container-color); }',
        },
      ]),
    ).toEqual([expect.stringContaining('must be owned by its component family')]);
  });

  it('keeps canonical Material independent from active legacy token declarations', () => {
    expect(analyze(repositorySources())).toEqual([]);
  });
});
