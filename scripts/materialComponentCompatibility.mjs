import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import postcss from 'postcss';

export const MATERIAL_COMPATIBILITY_VERSION = 1;

const FAMILY_ROOT = 'src/shared/ui/material/components';
const OWNER_ORDER = [
  'api-contract',
  'token-contract',
  'behavior-contract',
  'implementation',
  'migration',
];

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function relativePath(root, filePath) {
  return toPosix(path.relative(root, filePath));
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

function findMatchingBrace(source, openIndex) {
  let depth = 0;

  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function findInterfaceBodies(source, suffix) {
  const bodies = [];
  const pattern = new RegExp(
    `(?:export\\s+)?interface\\s+[A-Za-z_$][\\w$]*${suffix}\\b[^\\{]*\\{`,
    'g',
  );
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const openIndex = source.indexOf('{', match.index);
    const closeIndex = findMatchingBrace(source, openIndex);

    if (closeIndex < 0) {
      break;
    }

    bodies.push(source.slice(openIndex + 1, closeIndex));
    pattern.lastIndex = closeIndex + 1;
  }

  return bodies;
}

function listFilesRecursively(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];

  function visit(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (entry.isFile()) {
        files.push(entryPath);
      }
    }
  }

  visit(root);
  return files.sort((left, right) => left.localeCompare(right));
}

function isRuntimeSource(filePath) {
  const name = path.basename(filePath);

  if (!/\.(?:vue|[cm]?[jt]s)$/.test(name)) {
    return false;
  }

  if (
    name === 'contract.ts' ||
    name === 'index.ts' ||
    name.endsWith('.d.ts') ||
    /\.(?:test|spec|stories)\.[cm]?[jt]s$/.test(name)
  ) {
    return false;
  }

  return true;
}

function stripVueStyleBlocks(source) {
  return source.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
}

function findScopedStyleBlocks(source) {
  const blocks = [];
  const pattern = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi;
  let match;

  while ((match = pattern.exec(source)) !== null) {
    const [, openingAttrs, body] = match;

    if (/(?:^|\s)scoped(?:\s|=|>|$)/.test(openingAttrs)) {
      blocks.push(body);
    }
  }

  return blocks;
}

function isCanonicalRootSelector(selector) {
  return typeof selector === 'string' && selector.trim() === ':root';
}

function parseStylesheet(filePath, source) {
  return postcss.parse(source, { from: filePath });
}

// A public --md-comp-* default only counts as family-owned when its rule
// selector is exactly the canonical `:root` (after trimming). Selectors that
// merely contain ":root" (".md-example", ":root .md-example", ":root, .md-example")
// are ownership violations, not alternate spellings of root ownership.
function collectComponentTokenDeclarations(stylesheet) {
  const rootDeclarations = [];
  const nonRootDeclarations = [];

  stylesheet.walkDecls(/^--md-comp-/, (decl) => {
    const parentRule = decl.parent;

    if (parentRule?.type === 'rule' && isCanonicalRootSelector(parentRule.selector)) {
      rootDeclarations.push(decl);
    } else {
      nonRootDeclarations.push(decl);
    }
  });

  return { rootDeclarations, nonRootDeclarations };
}

function findSameFileDuplicateNames(rootDeclarations) {
  const counts = new Map();

  for (const decl of rootDeclarations) {
    counts.set(decl.prop, (counts.get(decl.prop) ?? 0) + 1);
  }

  return [...counts]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort((left, right) => left.localeCompare(right));
}

function findFamilyRootDeclaredNames(tokensPath) {
  let stylesheet;

  try {
    stylesheet = parseStylesheet(tokensPath, readText(tokensPath));
  } catch {
    return new Set();
  }

  const names = new Set();

  stylesheet.walkDecls(/^--md-comp-/, (decl) => {
    const parentRule = decl.parent;

    if (parentRule?.type === 'rule' && isCanonicalRootSelector(parentRule.selector)) {
      names.add(decl.prop);
    }
  });

  return names;
}

function findDuplicatePublicDefaults(root, family) {
  const componentsRoot = path.join(root, FAMILY_ROOT);

  if (!fs.existsSync(componentsRoot)) {
    return [];
  }

  const familiesByName = new Map();

  for (const entry of fs.readdirSync(componentsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const tokensPath = path.join(componentsRoot, entry.name, 'tokens.css');

    if (!fs.existsSync(tokensPath)) {
      continue;
    }

    for (const name of findFamilyRootDeclaredNames(tokensPath)) {
      if (!familiesByName.has(name)) {
        familiesByName.set(name, new Set());
      }

      familiesByName.get(name).add(entry.name);
    }
  }

  const duplicates = [];

  for (const [name, families] of familiesByName) {
    if (families.size > 1 && families.has(family)) {
      duplicates.push(name);
    }
  }

  return duplicates.sort((left, right) => left.localeCompare(right));
}

function createViolation(owner, rule, filePath, root, message) {
  return {
    owner,
    rule,
    path: relativePath(root, filePath),
    message,
  };
}

function checkApi(root, familyRoot) {
  const contractPath = path.join(familyRoot, 'contract.ts');

  if (!fs.existsSync(contractPath)) {
    return [
      createViolation(
        'api-contract',
        'missing-contract',
        contractPath,
        root,
        'contract.ts is missing',
      ),
    ];
  }

  const source = stripComments(readText(contractPath));
  const violations = [];

  if (/@m3e\/|--m3e-|<m3e-|\bM3e[A-Z]\w*|\bRenderer[A-Z]\w*/.test(source)) {
    violations.push(
      createViolation(
        'api-contract',
        'private-renderer-vocabulary',
        contractPath,
        root,
        'contract.ts contains renderer-private vocabulary',
      ),
    );
  }

  const slotBodies = findInterfaceBodies(source, 'Slots');

  if (slotBodies.some((body) => /^\s*[A-Za-z_$][\w$]*\??\s*:\s*\([^)]*\)\s*=>/m.test(body))) {
    violations.push(
      createViolation(
        'api-contract',
        'slot-property-signature',
        contractPath,
        root,
        'slot contract uses function-valued properties instead of Vue-shaped method signatures',
      ),
    );
  }

  return violations;
}

function checkTokens(root, familyRoot, family) {
  const tokensPath = path.join(familyRoot, 'tokens.css');

  if (!fs.existsSync(tokensPath)) {
    return [
      createViolation(
        'token-contract',
        'missing-token-contract',
        tokensPath,
        root,
        'tokens.css is missing',
      ),
    ];
  }

  const rawSource = readText(tokensPath);
  const violations = [];

  let stylesheet;

  try {
    stylesheet = parseStylesheet(tokensPath, rawSource);
  } catch (error) {
    return [
      createViolation(
        'token-contract',
        'invalid-css',
        tokensPath,
        root,
        `tokens.css failed to parse: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ];
  }

  const { rootDeclarations, nonRootDeclarations } = collectComponentTokenDeclarations(stylesheet);

  if (nonRootDeclarations.length > 0) {
    violations.push(
      createViolation(
        'token-contract',
        'component-token-outside-root',
        tokensPath,
        root,
        'a family-owned public default is declared on a local/component selector instead of :root',
      ),
    );
  }

  const sameFileDuplicates = findSameFileDuplicateNames(rootDeclarations);

  if (sameFileDuplicates.length > 0) {
    violations.push(
      createViolation(
        'token-contract',
        'duplicate-public-default-in-file',
        tokensPath,
        root,
        `public default(s) declared more than once in this family's tokens.css: ${sameFileDuplicates.join(', ')}`,
      ),
    );
  }

  if (stripComments(rawSource).includes('--m3e-')) {
    violations.push(
      createViolation(
        'token-contract',
        'private-renderer-token-in-public-catalogue',
        tokensPath,
        root,
        'public tokens.css contains private --m3e-* custom properties',
      ),
    );
  }

  const duplicates = findDuplicatePublicDefaults(root, family);

  if (duplicates.length > 0) {
    violations.push(
      createViolation(
        'token-contract',
        'duplicate-public-default',
        tokensPath,
        root,
        `public default(s) declared by more than one family tokens.css: ${duplicates.join(', ')}`,
      ),
    );
  }

  return violations;
}

function checkBehavior(root, familyRoot) {
  const behaviorPath = path.join(familyRoot, 'BEHAVIOR.md');

  if (!fs.existsSync(behaviorPath)) {
    return [
      createViolation(
        'behavior-contract',
        'missing-behavior-contract',
        behaviorPath,
        root,
        'BEHAVIOR.md is missing',
      ),
    ];
  }

  return [];
}

function checkImplementation(root, familyRoot) {
  const files = listFilesRecursively(familyRoot).filter(isRuntimeSource);
  const componentFiles = files.filter((filePath) => path.basename(filePath).endsWith('.vue'));

  if (componentFiles.length === 0) {
    return [
      createViolation(
        'implementation',
        'missing-vue-runtime',
        familyRoot,
        root,
        'no Vue runtime component exists for the family',
      ),
    ];
  }

  const violations = [];

  for (const filePath of files) {
    const rawSource = readText(filePath);

    if (filePath.endsWith('.vue')) {
      const scopedTokensImport = findScopedStyleBlocks(rawSource).some((block) =>
        /@import\s+['"][^'"]*tokens\.css['"]/.test(block),
      );

      if (scopedTokensImport) {
        violations.push(
          createViolation(
            'implementation',
            'scoped-token-contract-load',
            filePath,
            root,
            'family tokens.css is loaded through a scoped Vue <style> block instead of unscoped/global CSS',
          ),
        );
      }
    }

    const withoutStyles = filePath.endsWith('.vue') ? stripVueStyleBlocks(rawSource) : rawSource;
    const source = stripComments(withoutStyles);

    if (source.includes('--m3e-') || source.includes('--md-comp-')) {
      violations.push(
        createViolation(
          'implementation',
          'runtime-token-mapping',
          filePath,
          root,
          'runtime Vue/TypeScript contains Material or m3e custom-property names outside CSS ownership',
        ),
      );
    }
  }

  return violations;
}

function assertFamilyName(family) {
  if (!/^[A-Za-z][A-Za-z0-9]*$/.test(family)) {
    throw new Error(`Invalid Material family name: ${JSON.stringify(family)}`);
  }
}

export function resolveMaterialComponentCompatibility(root, family) {
  assertFamilyName(family);
  const familyRoot = path.join(root, FAMILY_ROOT, family);
  const checks = [
    () => checkApi(root, familyRoot),
    () => checkTokens(root, familyRoot, family),
    () => checkBehavior(root, familyRoot),
    () => checkImplementation(root, familyRoot),
  ];

  for (let index = 0; index < checks.length; index += 1) {
    const violations = checks[index]();

    if (violations.length > 0) {
      return {
        version: MATERIAL_COMPATIBILITY_VERSION,
        family,
        status: 'route',
        owner: OWNER_ORDER[index],
        violations,
      };
    }
  }

  return {
    version: MATERIAL_COMPATIBILITY_VERSION,
    family,
    status: 'clean',
    owner: null,
    violations: [],
  };
}

function parseArgs(argv) {
  if (argv.length !== 2 || argv[0] !== '--family' || !argv[1]) {
    throw new Error(
      'Usage: node scripts/materialComponentCompatibility.mjs --family <canonical-family>',
    );
  }

  return argv[1];
}

function main() {
  try {
    const family = parseArgs(process.argv.slice(2));
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    const result = resolveMaterialComponentCompatibility(root, family);
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`[material-compatibility] ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
