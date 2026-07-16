import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  extractScriptSource,
  resolveFileImports,
  stripComments,
  toPosixPath,
} from './lib/materialStaticImports.mjs';

// Deterministic, mechanical Material 3 architecture validator (M1).
//
// This validator proves only repository facts: paths, dependency direction,
// import/export boundaries, production-file profiles, CSS layer order, and
// required static proof artifacts. It does not parse blueprint prose,
// interpret Material correctness, or compare visual output. See
// docs/material-3/token-validation.md for the full validation-class model.

export const MATERIAL_ROOT = 'src/shared/ui/material';
const RUNTIME_NAMESPACES = ['foundation', 'components', 'patterns'];
const GOVERNANCE_BASENAMES = new Set(['README.md', 'AGENTS.md', 'CLAUDE.md']);

const PRODUCT_LAYER_PREFIXES = [
  'src/app/',
  'src/pages/',
  'src/widgets/',
  'src/features/',
  'src/entities/',
  'src/processes/',
];

const LEGACY_FOUNDATION_PREFIXES = [
  'src/shared/lib/md/',
  'src/shared/ui/State/',
  'src/shared/ui/Icon/',
  'src/shared/ui/Overlay/',
];

const GENERIC_LIB_PREFIX = 'src/shared/lib/';
const LEGACY_MATERIAL_LIB_PREFIX = 'src/shared/lib/md/';
const SHARED_UI_PREFIX = 'src/shared/ui/';
const IGNORED_DIR_NAMES = new Set(['node_modules', 'dist', '.git']);

const OFFICIAL_COMPONENT_FILENAME = /^MD[A-Z][A-Za-z0-9]*\.vue$/;
const TEST_OR_STORY_SUFFIXES = ['.test.ts', '.stories.ts', '.spec.ts'];

export const CODES = Object.freeze({
  MATERIAL_INVALID_ROOT_ARTIFACT: 'MATERIAL_INVALID_ROOT_ARTIFACT',
  MATERIAL_UNKNOWN_NAMESPACE: 'MATERIAL_UNKNOWN_NAMESPACE',
  MATERIAL_EMPTY_PRODUCTION_FILE: 'MATERIAL_EMPTY_PRODUCTION_FILE',
  MATERIAL_PLACEHOLDER_ARTIFACT: 'MATERIAL_PLACEHOLDER_ARTIFACT',
  MATERIAL_PREMATURE_ROOT_BARREL: 'MATERIAL_PREMATURE_ROOT_BARREL',
  MATERIAL_NEW_LEGACY_OWNER: 'MATERIAL_NEW_LEGACY_OWNER',
  MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY: 'MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY',

  MATERIAL_PRODUCT_IMPORT: 'MATERIAL_PRODUCT_IMPORT',
  MATERIAL_FOUNDATION_UPWARD_IMPORT: 'MATERIAL_FOUNDATION_UPWARD_IMPORT',
  MATERIAL_COMPONENT_PATTERN_IMPORT: 'MATERIAL_COMPONENT_PATTERN_IMPORT',
  MATERIAL_GENERIC_LIB_IMPORTS_MATERIAL: 'MATERIAL_GENERIC_LIB_IMPORTS_MATERIAL',
  MATERIAL_INTERNAL_ROOT_BARREL_IMPORT: 'MATERIAL_INTERNAL_ROOT_BARREL_IMPORT',
  MATERIAL_PRIVATE_CROSS_FAMILY_IMPORT: 'MATERIAL_PRIVATE_CROSS_FAMILY_IMPORT',
  MATERIAL_EXTERNAL_DEEP_IMPORT: 'MATERIAL_EXTERNAL_DEEP_IMPORT',
  MATERIAL_IMPLEMENTATION_IMPORT: 'MATERIAL_IMPLEMENTATION_IMPORT',

  MATERIAL_MISSING_LOCAL_ENTRY_POINT: 'MATERIAL_MISSING_LOCAL_ENTRY_POINT',
  MATERIAL_INVALID_PUBLIC_EXPORT: 'MATERIAL_INVALID_PUBLIC_EXPORT',
  MATERIAL_TESTING_EXPORT_IN_PRODUCTION_API: 'MATERIAL_TESTING_EXPORT_IN_PRODUCTION_API',
  MATERIAL_CSS_EXPORT_IN_PRODUCTION_API: 'MATERIAL_CSS_EXPORT_IN_PRODUCTION_API',
  MATERIAL_PRIVATE_EXPORT: 'MATERIAL_PRIVATE_EXPORT',

  MATERIAL_MISSING_COMPONENT_README: 'MATERIAL_MISSING_COMPONENT_README',
  MATERIAL_MISSING_COMPONENT_ENTRY_POINT: 'MATERIAL_MISSING_COMPONENT_ENTRY_POINT',
  MATERIAL_MISSING_COMPONENT_VUE: 'MATERIAL_MISSING_COMPONENT_VUE',
  MATERIAL_MISSING_COMPONENT_CSS: 'MATERIAL_MISSING_COMPONENT_CSS',
  MATERIAL_ORPHAN_PRODUCTION_LAYER: 'MATERIAL_ORPHAN_PRODUCTION_LAYER',
  MATERIAL_EMPTY_PRODUCTION_LAYER: 'MATERIAL_EMPTY_PRODUCTION_LAYER',
  MATERIAL_UNDECLARED_PRODUCTION_LAYER: 'MATERIAL_UNDECLARED_PRODUCTION_LAYER',
  MATERIAL_INVALID_CSS_LAYER_ORDER: 'MATERIAL_INVALID_CSS_LAYER_ORDER',
  MATERIAL_INLINE_COMPONENT_STYLE: 'MATERIAL_INLINE_COMPONENT_STYLE',

  MATERIAL_MISSING_COMPONENT_CONTRACT_TEST: 'MATERIAL_MISSING_COMPONENT_CONTRACT_TEST',
  MATERIAL_MISSING_COMPONENT_STORY: 'MATERIAL_MISSING_COMPONENT_STORY',
  MATERIAL_MISSING_STATE_MATRIX: 'MATERIAL_MISSING_STATE_MATRIX',
  MATERIAL_DUPLICATE_STATE_MATRIX: 'MATERIAL_DUPLICATE_STATE_MATRIX',
  MATERIAL_INVALID_STATE_MATRIX_ROOT: 'MATERIAL_INVALID_STATE_MATRIX_ROOT',
  MATERIAL_MISSING_CHECKERBOARD_BACKDROP: 'MATERIAL_MISSING_CHECKERBOARD_BACKDROP',
  MATERIAL_MISSING_VISUAL_SPEC: 'MATERIAL_MISSING_VISUAL_SPEC',
  MATERIAL_INVALID_VISUAL_SPEC_LINK: 'MATERIAL_INVALID_VISUAL_SPEC_LINK',

  MATERIAL_PARALLEL_LEGACY_OWNER: 'MATERIAL_PARALLEL_LEGACY_OWNER',
  MATERIAL_LEGACY_COMPAT_EXPORT: 'MATERIAL_LEGACY_COMPAT_EXPORT',
  MATERIAL_LEGACY_CONSUMER_IMPORT: 'MATERIAL_LEGACY_CONSUMER_IMPORT',
  MATERIAL_STALE_LEGACY_REFERENCE: 'MATERIAL_STALE_LEGACY_REFERENCE',
});

function finding(code, filePath, message) {
  return { code, path: filePath, message };
}

function sortFindings(findings) {
  return [...findings].sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );
}

// ---- filesystem helpers ----

function directoryExists(repoRoot, relativePath, fsApi) {
  const absolute = path.join(repoRoot, relativePath);
  return fsApi.existsSync(absolute) && fsApi.statSync(absolute).isDirectory();
}

function fileExists(repoRoot, relativePath, fsApi) {
  const absolute = path.join(repoRoot, relativePath);
  return fsApi.existsSync(absolute) && fsApi.statSync(absolute).isFile();
}

function readFile(repoRoot, relativePath, fsApi) {
  return fsApi.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function listChildren(repoRoot, relativePath, fsApi) {
  const absolute = path.join(repoRoot, relativePath);
  return fsApi
    .readdirSync(absolute, { withFileTypes: true })
    .filter((entry) => !IGNORED_DIR_NAMES.has(entry.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * Recursively collect every file under a directory as repository-relative
 * POSIX paths, sorted deterministically. Returns an empty array when the
 * directory does not exist.
 * @param repoRoot Absolute repository root.
 * @param relativeDir Repository-relative POSIX directory to walk.
 * @param fsApi Injectable `fs` module.
 * @returns Sorted repository-relative file paths.
 */
function collectFilesRecursive(repoRoot, relativeDir, fsApi) {
  if (!directoryExists(repoRoot, relativeDir, fsApi)) {
    return [];
  }

  const files = [];
  const stack = [relativeDir];

  while (stack.length > 0) {
    const current = stack.pop();
    const children = listChildren(repoRoot, current, fsApi);

    for (const child of children) {
      const childPath = path.posix.join(current, child.name);

      if (child.isDirectory()) {
        stack.push(childPath);
      } else if (child.isFile()) {
        files.push(childPath);
      }
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function isEmptyDirectoryRecursive(repoRoot, relativeDir, fsApi) {
  return collectFilesRecursive(repoRoot, relativeDir, fsApi).length === 0;
}

// ---- git helpers ----

/**
 * List every file that exists in a git ref's tree, for diff-aware checks
 * that must grandfather pre-existing legacy owners. Returns `null` when the
 * ref cannot be resolved (e.g. shallow clone, invalid ref); callers must
 * fail closed to "not new" in that case rather than guessing.
 * @param baseRef Git ref to inspect.
 * @param [options] Injection points for tests.
 * @param [options.repoRoot] Repository root to run git in.
 * @param [options.spawn] Injectable `spawnSync`.
 * @returns Set of POSIX repository-relative paths, or `null`.
 */
export function getFilesAtRef(baseRef, { repoRoot = process.cwd(), spawn = spawnSync } = {}) {
  const result = spawn('git', ['ls-tree', '-r', '--name-only', baseRef], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0 || typeof result.stdout !== 'string') {
    return null;
  }

  return new Set(
    result.stdout
      .split('\n')
      .map((line) => toPosixPath(line.trim()))
      .filter((line) => line.length > 0),
  );
}

// ---- canonical structure ----

function isBlankAfterComments(filePath, content) {
  const scriptSource = extractScriptSource(filePath, content);
  return stripComments(scriptSource).trim().length === 0;
}

function hasHonestProductionArtifact(repoRoot, fsApi) {
  for (const namespace of RUNTIME_NAMESPACES) {
    const files = collectFilesRecursive(repoRoot, path.posix.join(MATERIAL_ROOT, namespace), fsApi);

    for (const filePath of files) {
      const basename = path.posix.basename(filePath);

      if (GOVERNANCE_BASENAMES.has(basename) || basename === '.gitkeep') {
        continue;
      }

      const content = readFile(repoRoot, filePath, fsApi);

      if (content.trim().length > 0 && !isBlankAfterComments(filePath, content)) {
        return true;
      }
    }
  }

  return false;
}

function checkCanonicalStructure(repoRoot, fsApi) {
  const findings = [];

  if (!directoryExists(repoRoot, MATERIAL_ROOT, fsApi)) {
    return findings;
  }

  const rootChildren = listChildren(repoRoot, MATERIAL_ROOT, fsApi);
  const hasProductionArtifact = hasHonestProductionArtifact(repoRoot, fsApi);

  for (const child of rootChildren) {
    const childPath = path.posix.join(MATERIAL_ROOT, child.name);

    if (child.isFile()) {
      if (GOVERNANCE_BASENAMES.has(child.name)) {
        continue;
      }

      if (child.name === 'index.ts') {
        if (!hasProductionArtifact) {
          findings.push(
            finding(
              CODES.MATERIAL_PREMATURE_ROOT_BARREL,
              childPath,
              'The root Material barrel exists before any honest canonical production artifact. Remove it until at least one real family or foundation artifact is migrated.',
            ),
          );
        }
        continue;
      }

      findings.push(
        finding(
          CODES.MATERIAL_INVALID_ROOT_ARTIFACT,
          childPath,
          'Production files are not allowed directly under src/shared/ui/material. Move this file under foundation/, components/<family>/, or patterns/<pattern>/.',
        ),
      );
      continue;
    }

    if (!RUNTIME_NAMESPACES.includes(child.name)) {
      findings.push(
        finding(
          CODES.MATERIAL_UNKNOWN_NAMESPACE,
          childPath,
          `Unknown top-level Material namespace "${child.name}". Only foundation/, components/, and patterns/ are accepted runtime namespaces.`,
        ),
      );
    }
  }

  for (const namespace of RUNTIME_NAMESPACES) {
    const namespaceDir = path.posix.join(MATERIAL_ROOT, namespace);

    if (!directoryExists(repoRoot, namespaceDir, fsApi)) {
      continue;
    }

    findings.push(...checkEmptyAndPlaceholderFiles(repoRoot, namespaceDir, fsApi));
    findings.push(...checkEmptyDirectories(repoRoot, namespaceDir, fsApi));
  }

  return findings;
}

function checkEmptyAndPlaceholderFiles(repoRoot, dir, fsApi) {
  const findings = [];

  for (const filePath of collectFilesRecursive(repoRoot, dir, fsApi)) {
    const basename = path.posix.basename(filePath);

    if (GOVERNANCE_BASENAMES.has(basename)) {
      continue;
    }

    if (basename === '.gitkeep') {
      findings.push(
        finding(
          CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
          filePath,
          'Placeholder .gitkeep files are forbidden in the Material library. Remove the file or add its first honest artifact.',
        ),
      );
      continue;
    }

    const content = readFile(repoRoot, filePath, fsApi);

    if (content.trim().length === 0) {
      findings.push(
        finding(
          CODES.MATERIAL_EMPTY_PRODUCTION_FILE,
          filePath,
          'This production file is empty. Remove it until it has real content, or add the required content.',
        ),
      );
      continue;
    }

    if (isBlankAfterComments(filePath, content)) {
      findings.push(
        finding(
          CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
          filePath,
          'This file contains no real declarations, only comments/whitespace. Remove the placeholder or add its first honest artifact.',
        ),
      );
    }
  }

  return findings;
}

function checkEmptyDirectories(repoRoot, dir, fsApi) {
  const findings = [];
  const stack = [dir];

  while (stack.length > 0) {
    const current = stack.pop();
    const children = listChildren(repoRoot, current, fsApi);

    for (const child of children) {
      if (!child.isDirectory()) {
        continue;
      }

      const childPath = path.posix.join(current, child.name);

      if (isEmptyDirectoryRecursive(repoRoot, childPath, fsApi)) {
        findings.push(
          finding(
            CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
            childPath,
            'Empty speculative directory. Remove it until an accepted artifact is added.',
          ),
        );
      } else {
        stack.push(childPath);
      }
    }
  }

  return findings;
}

// ---- new legacy ownership (diff-aware) ----

function checkNewLegacyOwnership(repoRoot, fsApi, filesAtBaseRef) {
  const findings = [];

  if (filesAtBaseRef === null) {
    return findings;
  }

  const scanRoots = ['src/shared/ui', 'src/shared/lib'];
  const candidateFiles = new Set();

  for (const root of scanRoots) {
    for (const filePath of collectFilesRecursive(repoRoot, root, fsApi)) {
      candidateFiles.add(filePath);
    }
  }

  for (const filePath of [...candidateFiles].sort((left, right) => left.localeCompare(right))) {
    if (filePath.startsWith(MATERIAL_ROOT)) {
      continue;
    }

    if (filesAtBaseRef.has(filePath)) {
      continue;
    }

    const basename = path.posix.basename(filePath);

    if (OFFICIAL_COMPONENT_FILENAME.test(basename)) {
      findings.push(
        finding(
          CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY,
          filePath,
          `New official Material component file must be created under ${MATERIAL_ROOT}/components/<family>/, not at this legacy path.`,
        ),
      );
      continue;
    }

    if (
      LEGACY_FOUNDATION_PREFIXES.some((prefix) => filePath.startsWith(prefix)) &&
      !TEST_OR_STORY_SUFFIXES.some((suffix) => filePath.endsWith(suffix))
    ) {
      findings.push(
        finding(
          CODES.MATERIAL_NEW_LEGACY_OWNER,
          filePath,
          `New Material ownership may not be added at this legacy foundation path. Create new foundation artifacts under ${MATERIAL_ROOT}/foundation/<domain>/.`,
        ),
      );
    }
  }

  return findings;
}

// ---- dependency direction and imports ----

function classifyPathLayer(internalPath) {
  if (internalPath === MATERIAL_ROOT || internalPath.startsWith(`${MATERIAL_ROOT}/`)) {
    const rest = internalPath.slice(MATERIAL_ROOT.length + 1);
    const [namespace, domain] = rest.split('/');
    return { inMaterial: true, namespace: namespace ?? null, domain: domain ?? null };
  }

  return { inMaterial: false, namespace: null, domain: null };
}

function isRootBarrelTarget(internalPath) {
  return internalPath === MATERIAL_ROOT || internalPath === `${MATERIAL_ROOT}/index.ts`;
}

function isNamespaceEntryPoint(internalPath, namespace) {
  return (
    internalPath === `${MATERIAL_ROOT}/${namespace}` ||
    internalPath === `${MATERIAL_ROOT}/${namespace}/index.ts`
  );
}

function isDomainEntryPoint(internalPath, namespace, domain) {
  if (domain === null) {
    return false;
  }

  return (
    internalPath === `${MATERIAL_ROOT}/${namespace}/${domain}` ||
    internalPath === `${MATERIAL_ROOT}/${namespace}/${domain}/index.ts`
  );
}

function checkDependencyDirection(repoRoot, fsApi) {
  const findings = [];
  const materialFiles = collectFilesRecursive(repoRoot, MATERIAL_ROOT, fsApi);
  const resolveOptions = { repoRoot, fsApi };

  for (const filePath of materialFiles) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.vue') && !filePath.endsWith('.mjs')) {
      continue;
    }

    const content = readFile(repoRoot, filePath, fsApi);
    const layer = classifyPathLayer(filePath);
    const imports = resolveFileImports(filePath, content, resolveOptions);

    for (const importEntry of imports) {
      const targetLayer = classifyPathLayer(importEntry.path);

      if (
        PRODUCT_LAYER_PREFIXES.some((prefix) => importEntry.path.startsWith(prefix)) ||
        (!targetLayer.inMaterial &&
          ['@feature/', '@entity/', '@widget/', '@page/'].some((alias) =>
            importEntry.specifier.startsWith(alias),
          ))
      ) {
        findings.push(
          finding(
            CODES.MATERIAL_PRODUCT_IMPORT,
            filePath,
            `Material library code imports product-layer path "${importEntry.specifier}". The Material library must not import src/app, src/pages, src/widgets, src/features, src/entities, or src/processes.`,
          ),
        );
        continue;
      }

      if (!targetLayer.inMaterial) {
        continue;
      }

      if (isRootBarrelTarget(importEntry.path) && filePath !== `${MATERIAL_ROOT}/index.ts`) {
        findings.push(
          finding(
            CODES.MATERIAL_INTERNAL_ROOT_BARREL_IMPORT,
            filePath,
            'Internal Material code must not import the root @shared/ui/material barrel. Use the owning family/foundation entry point instead.',
          ),
        );
        continue;
      }

      if (layer.namespace === 'foundation') {
        if (targetLayer.namespace === 'components' || targetLayer.namespace === 'patterns') {
          findings.push(
            finding(
              CODES.MATERIAL_FOUNDATION_UPWARD_IMPORT,
              filePath,
              `foundation must not import ${targetLayer.namespace}. Foundation is a lower layer than components and patterns.`,
            ),
          );
        }
        continue;
      }

      if (layer.namespace === 'components') {
        if (targetLayer.namespace === 'patterns') {
          findings.push(
            finding(
              CODES.MATERIAL_COMPONENT_PATTERN_IMPORT,
              filePath,
              'components must not import patterns. Patterns compose components, not the other way around.',
            ),
          );
          continue;
        }

        if (
          targetLayer.namespace === 'components' &&
          targetLayer.domain !== null &&
          layer.domain !== targetLayer.domain &&
          !isNamespaceEntryPoint(importEntry.path, 'components') &&
          !isDomainEntryPoint(importEntry.path, 'components', targetLayer.domain)
        ) {
          findings.push(
            finding(
              CODES.MATERIAL_PRIVATE_CROSS_FAMILY_IMPORT,
              filePath,
              `The "${layer.domain}" family imports a private implementation path from the "${targetLayer.domain}" family. Import the target family's public entry point instead.`,
            ),
          );
          continue;
        }

        if (
          targetLayer.namespace === 'foundation' &&
          !isNamespaceEntryPoint(importEntry.path, 'foundation') &&
          !isDomainEntryPoint(importEntry.path, 'foundation', targetLayer.domain)
        ) {
          findings.push(
            finding(
              CODES.MATERIAL_IMPLEMENTATION_IMPORT,
              filePath,
              `Import the accepted foundation entry point instead of a private foundation implementation file ("${importEntry.path}").`,
            ),
          );
        }

        continue;
      }

      if (layer.namespace === 'patterns') {
        if (
          targetLayer.namespace === 'patterns' &&
          targetLayer.domain !== null &&
          layer.domain !== targetLayer.domain &&
          !isNamespaceEntryPoint(importEntry.path, 'patterns') &&
          !isDomainEntryPoint(importEntry.path, 'patterns', targetLayer.domain)
        ) {
          findings.push(
            finding(
              CODES.MATERIAL_PRIVATE_CROSS_FAMILY_IMPORT,
              filePath,
              `The "${layer.domain}" pattern imports a private implementation path from the "${targetLayer.domain}" pattern. Import the target pattern's public entry point instead.`,
            ),
          );
          continue;
        }

        if (
          (targetLayer.namespace === 'foundation' &&
            !isNamespaceEntryPoint(importEntry.path, 'foundation') &&
            !isDomainEntryPoint(importEntry.path, 'foundation', targetLayer.domain)) ||
          (targetLayer.namespace === 'components' &&
            targetLayer.domain !== null &&
            !isNamespaceEntryPoint(importEntry.path, 'components') &&
            !isDomainEntryPoint(importEntry.path, 'components', targetLayer.domain))
        ) {
          findings.push(
            finding(
              CODES.MATERIAL_IMPLEMENTATION_IMPORT,
              filePath,
              `Import the accepted public entry point instead of a private implementation file ("${importEntry.path}").`,
            ),
          );
        }
      }
    }
  }

  return findings;
}

function checkGenericLibImportsMaterial(repoRoot, fsApi) {
  const findings = [];
  const files = collectFilesRecursive(repoRoot, GENERIC_LIB_PREFIX, fsApi).filter(
    (filePath) =>
      !filePath.startsWith(LEGACY_MATERIAL_LIB_PREFIX) &&
      (filePath.endsWith('.ts') || filePath.endsWith('.vue') || filePath.endsWith('.mjs')),
  );
  const resolveOptions = { repoRoot, fsApi };

  for (const filePath of files) {
    const content = readFile(repoRoot, filePath, fsApi);
    const imports = resolveFileImports(filePath, content, resolveOptions);

    for (const importEntry of imports) {
      if (importEntry.path === MATERIAL_ROOT || importEntry.path.startsWith(`${MATERIAL_ROOT}/`)) {
        findings.push(
          finding(
            CODES.MATERIAL_GENERIC_LIB_IMPORTS_MATERIAL,
            filePath,
            'Generic shared/lib infrastructure must not import the Material library or gain component-family ownership.',
          ),
        );
        break;
      }
    }
  }

  return findings;
}

const MATERIAL_ENTRY_POINT_ALLOWED_TARGETS = (internalPath) => {
  const layer = classifyPathLayer(internalPath);

  if (!layer.inMaterial) {
    return false;
  }

  if (isRootBarrelTarget(internalPath)) {
    return true;
  }

  if (layer.domain === null) {
    return isNamespaceEntryPoint(internalPath, layer.namespace);
  }

  return isDomainEntryPoint(internalPath, layer.namespace, layer.domain);
};

function checkExternalDeepImports(repoRoot, fsApi) {
  const findings = [];
  const files = [
    ...collectFilesRecursive(repoRoot, 'src', fsApi),
    ...collectFilesRecursive(repoRoot, 'tests', fsApi),
  ].filter(
    (filePath) =>
      !filePath.startsWith(MATERIAL_ROOT) &&
      (filePath.endsWith('.ts') || filePath.endsWith('.vue') || filePath.endsWith('.mjs')),
  );
  const resolveOptions = { repoRoot, fsApi };

  for (const filePath of files) {
    const content = readFile(repoRoot, filePath, fsApi);
    const imports = resolveFileImports(filePath, content, resolveOptions);

    for (const importEntry of imports) {
      const layer = classifyPathLayer(importEntry.path);

      if (!layer.inMaterial) {
        continue;
      }

      if (!MATERIAL_ENTRY_POINT_ALLOWED_TARGETS(importEntry.path)) {
        findings.push(
          finding(
            CODES.MATERIAL_EXTERNAL_DEEP_IMPORT,
            filePath,
            `Deep import into Material library internals ("${importEntry.specifier}"). Import the family/foundation/pattern public entry point instead.`,
          ),
        );
      }
    }
  }

  return findings;
}

// ---- public exports ----

const PRIVATE_NAME_PATTERN = /(^_|private|internal)/i;

function classifyExportTarget(targetPath) {
  const basename = path.posix.basename(targetPath);

  if (TEST_OR_STORY_SUFFIXES.some((suffix) => basename.endsWith(suffix))) {
    return 'testing';
  }

  if (basename.endsWith('.css')) {
    return 'css';
  }

  if (PRIVATE_NAME_PATTERN.test(basename)) {
    return 'private';
  }

  return 'public';
}

function checkEntryPointExports(repoRoot, entryPointPath, fsApi) {
  const findings = [];

  if (!fileExists(repoRoot, entryPointPath, fsApi)) {
    return findings;
  }

  const content = readFile(repoRoot, entryPointPath, fsApi);
  const imports = resolveFileImports(entryPointPath, content, { repoRoot, fsApi });

  for (const importEntry of imports) {
    const classification = classifyExportTarget(importEntry.path);

    if (classification === 'testing') {
      findings.push(
        finding(
          CODES.MATERIAL_TESTING_EXPORT_IN_PRODUCTION_API,
          entryPointPath,
          `Production entry point exports a testing artifact ("${importEntry.specifier}"). Remove it from the public API.`,
        ),
      );
    } else if (classification === 'css') {
      findings.push(
        finding(
          CODES.MATERIAL_CSS_EXPORT_IN_PRODUCTION_API,
          entryPointPath,
          `Production entry point exports a CSS implementation file ("${importEntry.specifier}"). CSS is not a JavaScript/TypeScript export.`,
        ),
      );
    } else if (classification === 'private') {
      findings.push(
        finding(
          CODES.MATERIAL_PRIVATE_EXPORT,
          entryPointPath,
          `Production entry point exports a file named as private/internal ("${importEntry.specifier}"). Only intentionally public contracts may be exported.`,
        ),
      );
    } else if (!importEntry.exists) {
      findings.push(
        finding(
          CODES.MATERIAL_INVALID_PUBLIC_EXPORT,
          entryPointPath,
          `Production entry point export target does not exist ("${importEntry.specifier}").`,
        ),
      );
    }
  }

  return findings;
}

function checkRootBarrelExports(repoRoot, fsApi) {
  const findings = [];
  const rootEntry = `${MATERIAL_ROOT}/index.ts`;

  if (!fileExists(repoRoot, rootEntry, fsApi)) {
    return findings;
  }

  const content = readFile(repoRoot, rootEntry, fsApi);
  const imports = resolveFileImports(rootEntry, content, { repoRoot, fsApi });

  for (const importEntry of imports) {
    const layer = classifyPathLayer(importEntry.path);
    const isAcceptedDomainEntry =
      layer.inMaterial &&
      layer.namespace !== null &&
      RUNTIME_NAMESPACES.includes(layer.namespace) &&
      (isNamespaceEntryPoint(importEntry.path, layer.namespace) ||
        isDomainEntryPoint(importEntry.path, layer.namespace, layer.domain));

    if (!isAcceptedDomainEntry) {
      findings.push(
        finding(
          CODES.MATERIAL_INVALID_PUBLIC_EXPORT,
          rootEntry,
          `Root barrel export ("${importEntry.specifier}") does not point to an accepted family/foundation/pattern entry point.`,
        ),
      );
    }
  }

  return findings;
}

function checkLocalEntryPoints(repoRoot, fsApi) {
  const findings = [];

  for (const namespace of ['foundation', 'patterns']) {
    const namespaceDir = path.posix.join(MATERIAL_ROOT, namespace);

    if (!directoryExists(repoRoot, namespaceDir, fsApi)) {
      continue;
    }

    for (const child of listChildren(repoRoot, namespaceDir, fsApi)) {
      if (!child.isDirectory()) {
        continue;
      }

      const domainDir = path.posix.join(namespaceDir, child.name);

      if (isEmptyDirectoryRecursive(repoRoot, domainDir, fsApi)) {
        continue;
      }

      if (!fileExists(repoRoot, path.posix.join(domainDir, 'index.ts'), fsApi)) {
        findings.push(
          finding(
            CODES.MATERIAL_MISSING_LOCAL_ENTRY_POINT,
            domainDir,
            `Missing local index.ts entry point for ${namespace}/${child.name}.`,
          ),
        );
      }

      findings.push(
        ...checkEntryPointExports(repoRoot, path.posix.join(domainDir, 'index.ts'), fsApi),
      );
    }
  }

  return findings;
}

// ---- component production profiles ----

function toKebabCase(componentName) {
  const withoutPrefix = componentName.startsWith('MD') ? componentName.slice(2) : componentName;
  return withoutPrefix
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

const CSS_LAYER_ORDER = ['familyTokens', 'componentTokens', 'routes', 'states', 'anatomy', 'css'];

function classifyCssLayer(basename, componentName, familyPascalName) {
  if (basename === `${familyPascalName}.tokens.css`) {
    return 'familyTokens';
  }
  if (basename === `${componentName}.tokens.css`) {
    return 'componentTokens';
  }
  if (basename === `${componentName}.routes.css`) {
    return 'routes';
  }
  if (basename === `${componentName}.states.css`) {
    return 'states';
  }
  if (basename === `${familyPascalName}Anatomy.css`) {
    return 'anatomy';
  }
  if (basename === `${componentName}.css`) {
    return 'css';
  }
  return null;
}

const ORDERED_CSS_IMPORT_PATTERN = /\bimport\s*(['"])(\.\/[^'"\r\n]+\.css)\1/g;

function checkCssImportOrder(repoRoot, componentVuePath, componentName, familyPascalName, fsApi) {
  const findings = [];
  const content = readFile(repoRoot, componentVuePath, fsApi);
  const scriptSource = stripComments(extractScriptSource(componentVuePath, content));
  const importedLayers = [];

  for (const match of scriptSource.matchAll(ORDERED_CSS_IMPORT_PATTERN)) {
    const basename = path.posix.basename(match[2]);
    const layer = classifyCssLayer(basename, componentName, familyPascalName);

    if (layer !== null) {
      importedLayers.push(layer);
    }
  }

  let previousRank = -1;

  for (const layer of importedLayers) {
    const rank = CSS_LAYER_ORDER.indexOf(layer);

    if (rank < previousRank) {
      findings.push(
        finding(
          CODES.MATERIAL_INVALID_CSS_LAYER_ORDER,
          componentVuePath,
          'Style imports are out of canonical order. Expected order: <Family>.tokens.css, <Component>.tokens.css, <Component>.routes.css, <Component>.states.css, <Family>Anatomy.css, <Component>.css (omitting inapplicable layers).',
        ),
      );
      break;
    }

    previousRank = rank;
  }

  return findings;
}

function checkInlineComponentStyle(repoRoot, componentVuePath, fsApi) {
  const content = readFile(repoRoot, componentVuePath, fsApi);
  const styleMatch = /<style\b[^>]*>([\s\S]*?)<\/style>/i.exec(content);

  if (styleMatch && styleMatch[1].trim().length > 0) {
    return [
      finding(
        CODES.MATERIAL_INLINE_COMPONENT_STYLE,
        componentVuePath,
        'Inline <style> blocks are forbidden in canonical Material components. Move styles to the owning CSS layer file.',
      ),
    ];
  }

  return [];
}

function familyPascalNameFromDirName(dirName) {
  return dirName.charAt(0).toUpperCase() + dirName.slice(1);
}

function checkComponentFamily(repoRoot, familyDirName, fsApi) {
  const findings = [];
  const familyDir = path.posix.join(MATERIAL_ROOT, 'components', familyDirName);

  if (isEmptyDirectoryRecursive(repoRoot, familyDir, fsApi)) {
    return findings;
  }

  const children = listChildren(repoRoot, familyDir, fsApi).filter((entry) => entry.isFile());
  const filenames = new Set(children.map((entry) => entry.name));
  const componentFiles = children
    .map((entry) => entry.name)
    .filter((name) => OFFICIAL_COMPONENT_FILENAME.test(name) && !/story/i.test(name));
  const componentNames = componentFiles
    .map((name) => name.slice(0, -'.vue'.length))
    .sort((left, right) => left.localeCompare(right));
  const familyPascalName = familyPascalNameFromDirName(familyDirName);

  if (!filenames.has('README.md')) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_COMPONENT_README,
        path.posix.join(familyDir, 'README.md'),
        `Missing family blueprint README for components/${familyDirName}.`,
      ),
    );
  }

  if (!filenames.has('index.ts')) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_COMPONENT_ENTRY_POINT,
        path.posix.join(familyDir, 'index.ts'),
        `Missing family entry point for components/${familyDirName}.`,
      ),
    );
  } else {
    findings.push(
      ...checkEntryPointExports(repoRoot, path.posix.join(familyDir, 'index.ts'), fsApi),
    );
  }

  if (componentNames.length === 0) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_COMPONENT_VUE,
        familyDir,
        `components/${familyDirName} has no public MD*.vue component. Add the component or remove the family directory.`,
      ),
    );
    return findings;
  }

  const recognizedFilenames = new Set(['README.md', 'index.ts']);

  for (const componentName of componentNames) {
    recognizedFilenames.add(`${componentName}.vue`);
    recognizedFilenames.add(`${componentName}.test.ts`);
    recognizedFilenames.add(`${componentName}.stories.ts`);
    recognizedFilenames.add(`${componentName}.css`);
    recognizedFilenames.add(`${componentName}.routes.css`);
    recognizedFilenames.add(`${componentName}.states.css`);
    recognizedFilenames.add(`${componentName}.tokens.css`);
    recognizedFilenames.add(`${componentName}Behavior.ts`);
    recognizedFilenames.add(`use${componentName}Behavior.ts`);
  }

  recognizedFilenames.add(`${familyPascalName}.tokens.css`);
  recognizedFilenames.add(`${familyPascalName}Anatomy.css`);
  recognizedFilenames.add(`${familyPascalName}Context.ts`);

  for (const filename of filenames) {
    if (recognizedFilenames.has(filename) || /story/i.test(filename)) {
      continue;
    }

    if (filename.endsWith('.css')) {
      const withoutExtension = filename.replace(/\.(tokens|routes|states)?\.?css$/, '');
      findings.push(
        finding(
          CODES.MATERIAL_ORPHAN_PRODUCTION_LAYER,
          path.posix.join(familyDir, filename),
          `CSS layer file has no matching public component or family owner ("${withoutExtension}").`,
        ),
      );
      continue;
    }

    findings.push(
      finding(
        CODES.MATERIAL_UNDECLARED_PRODUCTION_LAYER,
        path.posix.join(familyDir, filename),
        'Unrecognized production-file category for a Material component family.',
      ),
    );
  }

  for (const componentName of componentNames) {
    const vuePath = path.posix.join(familyDir, `${componentName}.vue`);
    const cssPath = path.posix.join(familyDir, `${componentName}.css`);

    if (!filenames.has(`${componentName}.css`)) {
      findings.push(
        finding(
          CODES.MATERIAL_MISSING_COMPONENT_CSS,
          cssPath,
          `Missing required ${componentName}.css production layer.`,
        ),
      );
    }

    for (const suffix of ['tokens', 'routes', 'states']) {
      const layerName = `${componentName}.${suffix}.css`;

      if (filenames.has(layerName)) {
        const content = readFile(repoRoot, path.posix.join(familyDir, layerName), fsApi);

        if (content.trim().length === 0) {
          findings.push(
            finding(
              CODES.MATERIAL_EMPTY_PRODUCTION_LAYER,
              path.posix.join(familyDir, layerName),
              `Empty ${suffix} CSS layer file. Remove it or add real content.`,
            ),
          );
        }
      }
    }

    if (filenames.has(`${componentName}.css`)) {
      const content = readFile(repoRoot, cssPath, fsApi);

      if (content.trim().length === 0) {
        findings.push(
          finding(
            CODES.MATERIAL_EMPTY_PRODUCTION_LAYER,
            cssPath,
            'Empty primary CSS layer file. Remove it or add real content.',
          ),
        );
      }
    }

    if (!filenames.has(`${componentName}.test.ts`)) {
      findings.push(
        finding(
          CODES.MATERIAL_MISSING_COMPONENT_CONTRACT_TEST,
          path.posix.join(familyDir, `${componentName}.test.ts`),
          `Missing colocated component contract test for ${componentName}.`,
        ),
      );
    }

    findings.push(
      ...checkComponentProofArtifacts(repoRoot, familyDir, familyDirName, componentName, fsApi),
    );

    if (filenames.has(`${componentName}.vue`)) {
      findings.push(...checkInlineComponentStyle(repoRoot, vuePath, fsApi));
      findings.push(
        ...checkCssImportOrder(repoRoot, vuePath, componentName, familyPascalName, fsApi),
      );
    }
  }

  findings.push(...checkMigrationResidueForFamily(repoRoot, familyDirName, componentNames, fsApi));

  return findings;
}

// ---- standard static proof artifacts ----

const STATE_MATRIX_EXPORT_PATTERN = /\bexport\s+const\s+StateMatrix\b/g;
const STATE_MATRIX_REEXPORT_PATTERN = /\bexport\s*\{[^}]*\bStateMatrix\b[^}]*\}/g;

function fileDeclaresStateMatrix(content) {
  const cleaned = stripComments(content);
  return (
    [...cleaned.matchAll(STATE_MATRIX_EXPORT_PATTERN)].length > 0 ||
    [...cleaned.matchAll(STATE_MATRIX_REEXPORT_PATTERN)].length > 0
  );
}

function checkComponentProofArtifacts(repoRoot, familyDir, familyDirName, componentName, fsApi) {
  const findings = [];
  const storyPath = path.posix.join(familyDir, `${componentName}.stories.ts`);
  const kebabName = toKebabCase(componentName);
  const rootAnchor = `visual-${kebabName}-state-matrix`;

  if (!fileExists(repoRoot, storyPath, fsApi)) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_COMPONENT_STORY,
        storyPath,
        `Missing Storybook story file for ${componentName}.`,
      ),
    );
    return findings;
  }

  const relatedStoryFiles = listChildren(repoRoot, familyDir, fsApi)
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(componentName) && name.endsWith('.stories.ts'));
  const relatedVueStoryFiles = listChildren(repoRoot, familyDir, fsApi)
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith(componentName) && /Story\.vue$/.test(name));

  const filesDeclaringMatrix = [];

  for (const name of [...relatedStoryFiles, ...relatedVueStoryFiles].sort((left, right) =>
    left.localeCompare(right),
  )) {
    const content = readFile(repoRoot, path.posix.join(familyDir, name), fsApi);

    if (fileDeclaresStateMatrix(content)) {
      filesDeclaringMatrix.push(name);
    }
  }

  if (filesDeclaringMatrix.length === 0) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_STATE_MATRIX,
        storyPath,
        `Missing canonical Storybook export named StateMatrix for ${componentName}.`,
      ),
    );
  } else if (filesDeclaringMatrix.length > 1) {
    for (const name of filesDeclaringMatrix) {
      findings.push(
        finding(
          CODES.MATERIAL_DUPLICATE_STATE_MATRIX,
          path.posix.join(familyDir, name),
          `Multiple competing canonical StateMatrix stories exist for ${componentName}: ${filesDeclaringMatrix.join(', ')}.`,
        ),
      );
    }
  } else {
    const matrixContent = [...relatedStoryFiles, ...relatedVueStoryFiles]
      .map((name) => readFile(repoRoot, path.posix.join(familyDir, name), fsApi))
      .join('\n');

    if (!matrixContent.includes(rootAnchor)) {
      findings.push(
        finding(
          CODES.MATERIAL_INVALID_STATE_MATRIX_ROOT,
          storyPath,
          `Missing canonical state-matrix root anchor data-testid="${rootAnchor}".`,
        ),
      );
    }

    if (!matrixContent.includes('visual-checker-backdrop')) {
      findings.push(
        finding(
          CODES.MATERIAL_MISSING_CHECKERBOARD_BACKDROP,
          storyPath,
          'Missing canonical outer class "visual-checker-backdrop" on the state-matrix surface.',
        ),
      );
    }
  }

  const visualSpecPath = `tests/e2e/visual/material/${familyDirName}.spec.ts`;

  if (!fileExists(repoRoot, visualSpecPath, fsApi)) {
    findings.push(
      finding(
        CODES.MATERIAL_MISSING_VISUAL_SPEC,
        visualSpecPath,
        `Missing Playwright visual regression spec for the ${familyDirName} family.`,
      ),
    );
  } else {
    const specContent = readFile(repoRoot, visualSpecPath, fsApi);

    if (!specContent.includes(rootAnchor)) {
      findings.push(
        finding(
          CODES.MATERIAL_INVALID_VISUAL_SPEC_LINK,
          visualSpecPath,
          `Visual spec does not reference the canonical state-matrix root anchor ("${rootAnchor}") for ${componentName}.`,
        ),
      );
    }
  }

  return findings;
}

// ---- completed migration residue ----

const NAMED_EXPORT_PATTERN =
  /\bexport\s*\{\s*([^}]+)\s*\}\s*from\s*(['"])((?:(?!\2)[^\\]|\\.)*)\2/g;

function extractExportedIdentifiers(content) {
  const cleaned = stripComments(content);
  const names = new Set();

  for (const match of cleaned.matchAll(NAMED_EXPORT_PATTERN)) {
    for (const rawSpecifier of match[1].split(',')) {
      const trimmed = rawSpecifier.trim();

      if (trimmed.length === 0) {
        continue;
      }

      const asMatch = /\bas\s+([\w$]+)$/.exec(trimmed);
      const name = asMatch ? asMatch[1] : trimmed;

      if (name !== 'default') {
        names.add(name);
      }
    }
  }

  return names;
}

function checkMigrationResidueForFamily(repoRoot, familyDirName, componentNames, fsApi) {
  const findings = [];
  const familyEntryPoint = path.posix.join(MATERIAL_ROOT, 'components', familyDirName, 'index.ts');

  if (!fileExists(repoRoot, familyEntryPoint, fsApi)) {
    return findings;
  }

  const canonicalNames = extractExportedIdentifiers(readFile(repoRoot, familyEntryPoint, fsApi));

  if (canonicalNames.size === 0) {
    return findings;
  }

  if (!directoryExists(repoRoot, SHARED_UI_PREFIX, fsApi)) {
    return findings;
  }

  const legacyFamilyDirs = listChildren(repoRoot, SHARED_UI_PREFIX, fsApi).filter(
    (entry) => entry.isDirectory() && entry.name !== 'material',
  );
  const parallelLegacyNames = new Set();

  for (const legacyDir of legacyFamilyDirs) {
    const legacyEntryPoint = path.posix.join(SHARED_UI_PREFIX, legacyDir.name, 'index.ts');

    if (!fileExists(repoRoot, legacyEntryPoint, fsApi)) {
      continue;
    }

    const legacyContent = readFile(repoRoot, legacyEntryPoint, fsApi);
    const legacyNames = extractExportedIdentifiers(legacyContent);
    const overlap = [...legacyNames].filter((name) => canonicalNames.has(name));

    if (overlap.length > 0) {
      findings.push(
        finding(
          CODES.MATERIAL_PARALLEL_LEGACY_OWNER,
          legacyEntryPoint,
          `Legacy owner still exports the same public component identity as the canonical owner (${overlap.join(', ')}).`,
        ),
      );

      for (const name of overlap) {
        parallelLegacyNames.add(name);
      }
    }

    const legacyImports = resolveFileImports(legacyEntryPoint, legacyContent, { repoRoot, fsApi });

    for (const importEntry of legacyImports) {
      if (importEntry.path.startsWith(MATERIAL_ROOT)) {
        findings.push(
          finding(
            CODES.MATERIAL_LEGACY_COMPAT_EXPORT,
            legacyEntryPoint,
            `Legacy entry point forwards to the canonical Material owner ("${importEntry.specifier}"). Permanent compatibility re-exports are forbidden.`,
          ),
        );
      }
    }

    if (overlap.length > 0) {
      findings.push(...checkStaleLegacyConsumers(repoRoot, legacyDir.name, fsApi));
    }
  }

  return findings;
}

function checkStaleLegacyConsumers(repoRoot, legacyFamilyName, fsApi) {
  const findings = [];
  const legacyDir = path.posix.join(SHARED_UI_PREFIX, legacyFamilyName);
  const candidateFiles = [
    ...collectFilesRecursive(repoRoot, 'src', fsApi),
    ...collectFilesRecursive(repoRoot, 'tests', fsApi),
  ].filter(
    (filePath) =>
      !filePath.startsWith(legacyDir) &&
      !filePath.startsWith(MATERIAL_ROOT) &&
      (filePath.endsWith('.ts') || filePath.endsWith('.vue') || filePath.endsWith('.mjs')),
  );

  for (const filePath of candidateFiles) {
    const content = readFile(repoRoot, filePath, fsApi);
    const imports = resolveFileImports(filePath, content, { repoRoot, fsApi });

    for (const importEntry of imports) {
      if (importEntry.path === legacyDir || importEntry.path.startsWith(`${legacyDir}/`)) {
        const isProofArtifact =
          TEST_OR_STORY_SUFFIXES.some((suffix) => filePath.endsWith(suffix)) ||
          filePath.startsWith('tests/e2e/');

        findings.push(
          finding(
            isProofArtifact
              ? CODES.MATERIAL_STALE_LEGACY_REFERENCE
              : CODES.MATERIAL_LEGACY_CONSUMER_IMPORT,
            filePath,
            `Still references the obsolete legacy owner "${legacyFamilyName}" ("${importEntry.specifier}") after a canonical owner exists.`,
          ),
        );
        break;
      }
    }
  }

  return findings;
}

// ---- entry point ----

/**
 * Run the full deterministic Material static architecture validation.
 * @param [options] Validation inputs.
 * @param [options.repoRoot] Absolute repository root to validate.
 * @param [options.baseRef] Git ref used to distinguish newly added files
 * from pre-existing legacy owners; `null` disables diff-aware checks.
 * @param [options.fsApi] Injectable `fs` module, for tests.
 * @param [options.spawn] Injectable `spawnSync`, for tests.
 * @returns Sorted findings; empty when the repository is valid.
 */
export function validateMaterialLibrary({
  repoRoot = process.cwd(),
  baseRef = 'HEAD',
  fsApi = fs,
  spawn = spawnSync,
} = {}) {
  const filesAtBaseRef = baseRef === null ? null : getFilesAtRef(baseRef, { repoRoot, spawn });
  const findings = [
    ...checkCanonicalStructure(repoRoot, fsApi),
    ...checkNewLegacyOwnership(repoRoot, fsApi, filesAtBaseRef),
    ...checkDependencyDirection(repoRoot, fsApi),
    ...checkGenericLibImportsMaterial(repoRoot, fsApi),
    ...checkExternalDeepImports(repoRoot, fsApi),
    ...checkRootBarrelExports(repoRoot, fsApi),
    ...checkLocalEntryPoints(repoRoot, fsApi),
  ];

  const componentsDir = path.posix.join(MATERIAL_ROOT, 'components');

  if (directoryExists(repoRoot, componentsDir, fsApi)) {
    for (const child of listChildren(repoRoot, componentsDir, fsApi)) {
      if (child.isDirectory()) {
        findings.push(...checkComponentFamily(repoRoot, child.name, fsApi));
      }
    }
  }

  return sortFindings(findings);
}

/**
 * Format one finding as the required `[static-blocking][<CODE>] <path>:`
 * block.
 * @param finding Single validation finding.
 * @returns Multi-line formatted block, without a trailing newline.
 */
export function formatFinding({ code, path: findingPath, message }) {
  return `[static-blocking][${code}] ${findingPath}:\n${message}`;
}

function parseCliArgs(argv) {
  let baseRef = 'HEAD';

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--base-ref') {
      baseRef = argv[index + 1] ?? baseRef;
      index += 1;
    } else if (argv[index].startsWith('--base-ref=')) {
      baseRef = argv[index].slice('--base-ref='.length);
    }
  }

  return { baseRef };
}

function runCli() {
  const { baseRef } = parseCliArgs(process.argv.slice(2));
  const findings = validateMaterialLibrary({ baseRef });

  if (findings.length === 0) {
    console.log('material-static: 0 architecture findings.');
    return 0;
  }

  for (const item of findings) {
    console.log(formatFinding(item));
    console.log('');
  }

  console.log(`material-static: ${findings.length} architecture finding(s).`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runCli();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
