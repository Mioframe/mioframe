import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function findRootBlocks(source) {
  const blocks = [];
  let cursor = 0;

  while (cursor < source.length) {
    const rootIndex = source.indexOf(':root', cursor);

    if (rootIndex < 0) {
      break;
    }

    const openIndex = source.indexOf('{', rootIndex + ':root'.length);

    if (openIndex < 0) {
      break;
    }

    const closeIndex = findMatchingBrace(source, openIndex);

    if (closeIndex < 0) {
      break;
    }

    blocks.push(source.slice(openIndex + 1, closeIndex));
    cursor = closeIndex + 1;
  }

  return blocks;
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

function checkTokens(root, familyRoot) {
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

  const source = stripComments(readText(tokensPath));
  const violations = [];

  if (findRootBlocks(source).some((body) => body.includes('--md-comp-'))) {
    violations.push(
      createViolation(
        'token-contract',
        'component-tokens-on-root',
        tokensPath,
        root,
        'component-token defaults are declared on :root instead of the family component boundary',
      ),
    );
  }

  if (source.includes('--m3e-')) {
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
    () => checkTokens(root, familyRoot),
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
