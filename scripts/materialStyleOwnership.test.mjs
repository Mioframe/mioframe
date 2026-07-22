import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATERIAL_ROOT = path.join(ROOT, 'src', 'shared', 'ui', 'material');
const TYPESCALE_FILE = 'src/shared/ui/material/foundation/typescale/typescale.css';
const COMPONENT_PREFIX = 'src/shared/ui/material/components/';
const TYPESCALE_PROPERTIES = new Set([
  'font-family',
  'font-weight',
  'font-size',
  'line-height',
  'letter-spacing',
]);

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function walkFiles(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.css') ? [entryPath] : [];
  });
}

function location(file, node) {
  const line = node.source?.start?.line;
  return line ? `${file}:${line}` : file;
}

function analyzeStyle(file, source) {
  const errors = [];
  const root = postcss.parse(source, { from: file });

  if (file === TYPESCALE_FILE) {
    root.walkRules((rule) => {
      for (const selector of rule.selectors ?? []) {
        if (!/^\.md-typescale-[a-z0-9-]+$/.test(selector.trim())) {
          errors.push(
            `${location(file, rule)}: typescale must not own selector '${selector.trim()}'`,
          );
        }
      }
    });

    root.walkDecls((declaration) => {
      if (!TYPESCALE_PROPERTIES.has(declaration.prop)) {
        errors.push(`${location(file, declaration)}: typescale must not own '${declaration.prop}'`);
      }
    });
  }

  // Component state selectors must override one final private route directly. Foundation bridges
  // are outside this check because they may intentionally connect independently owned concerns.
  if (file.startsWith(COMPONENT_PREFIX)) {
    root.walkDecls(/^--md-private-.*-rendered-/, (declaration) => {
      if (/var\(\s*--md-private-/.test(declaration.value)) {
        errors.push(
          `${location(file, declaration)}: rendered private route '${declaration.prop}' must not add another private hop`,
        );
      }
    });
  }

  return errors;
}

function repositoryErrors() {
  return walkFiles(MATERIAL_ROOT).flatMap((filePath) => {
    const file = normalize(path.relative(ROOT, filePath));
    return analyzeStyle(file, fs.readFileSync(filePath, 'utf8'));
  });
}

describe('Material style ownership', () => {
  it('keeps typescale limited to role classes and font declarations', () => {
    expect(
      analyzeStyle(
        TYPESCALE_FILE,
        '.md-typescale-label-large { font-family: sans-serif; font-size: 14px; }',
      ),
    ).toEqual([]);

    const errors = analyzeStyle(TYPESCALE_FILE, 'h1, h2 { margin: 0; }');
    expect(errors.some((error) => error.includes("selector 'h1'"))).toBe(true);
    expect(errors.some((error) => error.includes("must not own 'margin'"))).toBe(true);
  });

  it('rejects base-state-rendered private alias chains in component styles', () => {
    const errors = analyzeStyle(
      'src/shared/ui/material/components/button/MDButton.css',
      '.md-button { --md-private-button-label-color: red; --md-private-button-rendered-label-color: var(--md-private-button-label-color); color: var(--md-private-button-rendered-label-color); }',
    );

    expect(errors).toEqual([
      expect.stringContaining("rendered private route '--md-private-button-rendered-label-color'"),
    ]);
  });

  it('does not apply the component-route rule to foundation bridges', () => {
    expect(
      analyzeStyle(
        'src/shared/ui/material/foundation/state/state.css',
        '.state { --md-private-state-rendered-color: var(--md-private-state-layer-color); }',
      ),
    ).toEqual([]);
  });

  it('keeps canonical Material styles within these ownership boundaries', () => {
    expect(repositoryErrors()).toEqual([]);
  });
});
