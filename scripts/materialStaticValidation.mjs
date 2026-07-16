import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Minimal, deterministic Material 3 architecture baseline (see
// docs/material-3/library-roadmap.md, milestone M1).
//
// This validator proves only repository facts that are already justified by
// current repository structure and documentation: canonical placement of
// new official components, empty canonical directories, a premature root
// barrel, and explicitly documented obsolete paths. It does not parse
// imports/exports, infer architecture profiles, or validate story/visual
// content. Dependency-direction rules live in .oxlintrc.json (ESLint/oxlint
// no-restricted-imports), not here. See docs/material-3/token-validation.md
// for the checks this baseline intentionally defers until real component
// migrations establish stable conventions.

export const MATERIAL_ROOT = 'src/shared/ui/material';
const RUNTIME_NAMESPACES = ['foundation', 'components', 'patterns'];
const GOVERNANCE_BASENAMES = new Set(['README.md', 'AGENTS.md', 'CLAUDE.md']);
const IGNORED_DIR_NAMES = new Set(['node_modules', 'dist', '.git']);
const OFFICIAL_COMPONENT_FILENAME = /^MD[A-Z][A-Za-z0-9]*\.vue$/;

// Paths already unambiguously deprecated by repository documentation, e.g. a
// completed migration whose blueprint/roadmap names the exact legacy path as
// removed. Add an entry only when repository documentation already names
// that exact path as obsolete; do not infer obsolescence from naming,
// exports, prefixes, stories, or neighboring directories.
export const OBSOLETE_MATERIAL_PATHS = [];

export const CODES = Object.freeze({
  MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY: 'MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY',
  MATERIAL_EMPTY_DIRECTORY: 'MATERIAL_EMPTY_DIRECTORY',
  MATERIAL_PLACEHOLDER_ARTIFACT: 'MATERIAL_PLACEHOLDER_ARTIFACT',
  MATERIAL_PREMATURE_ROOT_BARREL: 'MATERIAL_PREMATURE_ROOT_BARREL',
  MATERIAL_OBSOLETE_PATH: 'MATERIAL_OBSOLETE_PATH',
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

function toPosixPath(filePath) {
  return filePath.split(path.sep).join(path.posix.sep);
}

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

// ---- git helper (diff-aware new-file detection) ----

/**
 * List every file that exists in a git ref's tree, so the new-component
 * placement check can grandfather pre-existing legacy `MD*.vue` files.
 * Returns `null` when the ref cannot be resolved (e.g. shallow clone,
 * invalid ref); callers must fail closed to "not new" in that case rather
 * than guessing.
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

// ---- invariant 1: new official components must be canonically placed ----

function checkNewOfficialComponentPlacement(repoRoot, fsApi, filesAtBaseRef) {
  const findings = [];

  if (filesAtBaseRef === null) {
    return findings;
  }

  const canonicalComponentsDir = `${MATERIAL_ROOT}/components/`;

  for (const filePath of collectFilesRecursive(repoRoot, 'src', fsApi)) {
    if (filePath.startsWith(canonicalComponentsDir)) {
      continue;
    }

    if (!OFFICIAL_COMPONENT_FILENAME.test(path.posix.basename(filePath))) {
      continue;
    }

    if (filesAtBaseRef.has(filePath)) {
      continue;
    }

    findings.push(
      finding(
        CODES.MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY,
        filePath,
        `New official Material component file must be created under ${canonicalComponentsDir}<family>/, not at this path.`,
      ),
    );
  }

  return findings;
}

// ---- invariants 2/3: empty directories and placeholder artifacts ----

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
            CODES.MATERIAL_EMPTY_DIRECTORY,
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

function checkPlaceholderFiles(repoRoot, dir, fsApi) {
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

    if (readFile(repoRoot, filePath, fsApi).trim().length === 0) {
      findings.push(
        finding(
          CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
          filePath,
          'This production file is empty. Remove it until it has real content, or add the required content.',
        ),
      );
    }
  }

  return findings;
}

function checkEmptyAndPlaceholderArtifacts(repoRoot, fsApi) {
  const findings = [];

  for (const namespace of RUNTIME_NAMESPACES) {
    const namespaceDir = path.posix.join(MATERIAL_ROOT, namespace);

    if (!directoryExists(repoRoot, namespaceDir, fsApi)) {
      continue;
    }

    findings.push(...checkEmptyDirectories(repoRoot, namespaceDir, fsApi));
    findings.push(...checkPlaceholderFiles(repoRoot, namespaceDir, fsApi));
  }

  return findings;
}

// ---- invariant 3 (continued): premature root barrel ----

function hasRealProductionArtifact(repoRoot, fsApi) {
  for (const namespace of RUNTIME_NAMESPACES) {
    const namespaceDir = path.posix.join(MATERIAL_ROOT, namespace);

    for (const filePath of collectFilesRecursive(repoRoot, namespaceDir, fsApi)) {
      const basename = path.posix.basename(filePath);

      if (GOVERNANCE_BASENAMES.has(basename) || basename === '.gitkeep') {
        continue;
      }

      if (readFile(repoRoot, filePath, fsApi).trim().length > 0) {
        return true;
      }
    }
  }

  return false;
}

function checkPrematureRootBarrel(repoRoot, fsApi) {
  const rootBarrel = `${MATERIAL_ROOT}/index.ts`;

  if (!fileExists(repoRoot, rootBarrel, fsApi)) {
    return [];
  }

  if (readFile(repoRoot, rootBarrel, fsApi).trim().length === 0) {
    return [
      finding(
        CODES.MATERIAL_PLACEHOLDER_ARTIFACT,
        rootBarrel,
        'The root Material barrel is empty. Remove it until it has a real export.',
      ),
    ];
  }

  if (!hasRealProductionArtifact(repoRoot, fsApi)) {
    return [
      finding(
        CODES.MATERIAL_PREMATURE_ROOT_BARREL,
        rootBarrel,
        'The root Material barrel exists before any migrated component, foundation, or pattern artifact. Remove it until at least one real artifact is migrated.',
      ),
    ];
  }

  return [];
}

// ---- invariant 4: explicitly documented obsolete paths ----

function checkObsoletePaths(repoRoot, fsApi, obsoletePaths) {
  const findings = [];

  for (const obsoletePath of obsoletePaths) {
    if (
      fileExists(repoRoot, obsoletePath, fsApi) ||
      directoryExists(repoRoot, obsoletePath, fsApi)
    ) {
      findings.push(
        finding(
          CODES.MATERIAL_OBSOLETE_PATH,
          obsoletePath,
          'This path is explicitly deprecated by repository documentation. A canonical owner already replaced it; remove this path.',
        ),
      );
    }
  }

  return findings;
}

// ---- entry point ----

/**
 * Run the minimal deterministic Material architecture baseline.
 * @param [options] Validation inputs.
 * @param [options.repoRoot] Absolute repository root to validate.
 * @param [options.baseRef] Git ref used to distinguish newly added files
 * from pre-existing legacy owners; `null` (default) disables the
 * diff-aware new-component-placement check.
 * @param [options.fsApi] Injectable `fs` module, for tests.
 * @param [options.spawn] Injectable `spawnSync`, for tests.
 * @param [options.obsoletePaths] Explicit obsolete-path list, for tests.
 * @returns Sorted findings; empty when the repository is valid.
 */
export function validateMaterialLibrary({
  repoRoot = process.cwd(),
  baseRef = null,
  fsApi = fs,
  spawn = spawnSync,
  obsoletePaths = OBSOLETE_MATERIAL_PATHS,
} = {}) {
  const filesAtBaseRef = baseRef === null ? null : getFilesAtRef(baseRef, { repoRoot, spawn });

  const findings = [
    ...checkNewOfficialComponentPlacement(repoRoot, fsApi, filesAtBaseRef),
    ...checkEmptyAndPlaceholderArtifacts(repoRoot, fsApi),
    ...checkPrematureRootBarrel(repoRoot, fsApi),
    ...checkObsoletePaths(repoRoot, fsApi, obsoletePaths),
  ];

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
  let baseRef = null;

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
