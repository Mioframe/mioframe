import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Minimal, deterministic Material 3 architecture baseline (see
// docs/material-3/library-roadmap.md, milestone M1).
//
// This validator proves only repository facts that Git can actually
// preserve: canonical placement of new official components, and tracked
// placeholder files under the Material root. It does not parse
// imports/exports, infer architecture profiles, or validate story/visual
// content. Dependency-direction and public-import boundaries are not
// automated; they remain review-driven until real component migrations
// establish a stable public entry-point contract. See
// docs/material-3/token-validation.md for the checks this baseline
// intentionally defers.

export const MATERIAL_ROOT = 'src/shared/ui/material';
const IGNORED_DIR_NAMES = new Set(['node_modules', 'dist', '.git']);
const OFFICIAL_COMPONENT_FILENAME = /^MD[A-Z][A-Za-z0-9]*\.vue$/;

export const CODES = Object.freeze({
  MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY: 'MATERIAL_OFFICIAL_COMPONENT_OUTSIDE_LIBRARY',
  MATERIAL_PLACEHOLDER_ARTIFACT: 'MATERIAL_PLACEHOLDER_ARTIFACT',
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

// ---- git helper (diff-aware new-file detection) ----

/**
 * List every file that exists in a git ref's tree, so the new-component
 * placement check can grandfather pre-existing legacy `MD*.vue` files. Throws
 * when `baseRef` cannot be resolved (e.g. shallow clone, invalid ref):
 * an explicitly requested comparison ref that cannot be read is a validator
 * failure, not silent disablement. Callers pass `baseRef: null` upstream to
 * intentionally disable the diff-aware check instead of calling this
 * function.
 * @param baseRef Git ref to inspect.
 * @param [options] Injection points for tests.
 * @param [options.repoRoot] Repository root to run git in.
 * @param [options.spawn] Injectable `spawnSync`.
 * @returns Set of POSIX repository-relative paths.
 */
export function getFilesAtRef(baseRef, { repoRoot = process.cwd(), spawn = spawnSync } = {}) {
  const result = spawn('git', ['ls-tree', '-r', '--name-only', baseRef], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0 || typeof result.stdout !== 'string') {
    const context =
      typeof result.stderr === 'string' && result.stderr.trim().length > 0
        ? result.stderr.trim()
        : `git exited with status ${String(result.status)}`;

    throw new Error(
      `material-static: could not read files at base ref "${baseRef}" (${context}). Pass a valid comparison ref, or omit --base-ref to intentionally disable the diff-aware placement check.`,
    );
  }

  return new Set(
    result.stdout
      .split('\n')
      .map((line) => toPosixPath(line.trim()))
      .filter((line) => line.length > 0),
  );
}

// ---- invariant 1: new official components must be canonically placed ----

const CANONICAL_COMPONENT_PATH = new RegExp(
  `^${MATERIAL_ROOT}/components/[^/]+/MD[A-Z][A-Za-z0-9]*\\.vue$`,
);

function checkNewOfficialComponentPlacement(repoRoot, fsApi, filesAtBaseRef) {
  const findings = [];

  if (filesAtBaseRef === null) {
    return findings;
  }

  for (const filePath of collectFilesRecursive(repoRoot, 'src', fsApi)) {
    if (CANONICAL_COMPONENT_PATH.test(filePath)) {
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
        `New official Material component file must be created under ${MATERIAL_ROOT}/components/<family>/, not at this path.`,
      ),
    );
  }

  return findings;
}

// ---- invariant 2: placeholder files under the Material root ----

function checkPlaceholderFiles(repoRoot, dir, fsApi) {
  const findings = [];

  for (const filePath of collectFilesRecursive(repoRoot, dir, fsApi)) {
    const basename = path.posix.basename(filePath);

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
 * @returns Sorted findings; empty when the repository is valid.
 */
export function validateMaterialLibrary({
  repoRoot = process.cwd(),
  baseRef = null,
  fsApi = fs,
  spawn = spawnSync,
} = {}) {
  const filesAtBaseRef = baseRef === null ? null : getFilesAtRef(baseRef, { repoRoot, spawn });

  const findings = [
    ...checkNewOfficialComponentPlacement(repoRoot, fsApi, filesAtBaseRef),
    ...checkPlaceholderFiles(repoRoot, MATERIAL_ROOT, fsApi),
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

/**
 * Parse `--base-ref` from CLI args. Throws a concise usage error when
 * `--base-ref` is supplied without a non-empty value, so a malformed
 * invocation fails loudly instead of silently disabling the diff-aware
 * placement check.
 * @param argv CLI arguments, excluding the node binary and script path.
 * @returns The parsed base ref, or `null` when `--base-ref` was not passed.
 */
export function parseCliArgs(argv) {
  let baseRef = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--base-ref') {
      const value = argv[index + 1];

      if (value === undefined || value.startsWith('--')) {
        throw new Error('material-static: --base-ref requires a non-empty Git ref.');
      }

      baseRef = value;
      index += 1;
    } else if (arg.startsWith('--base-ref=')) {
      const value = arg.slice('--base-ref='.length);

      if (value.length === 0) {
        throw new Error('material-static: --base-ref requires a non-empty Git ref.');
      }

      baseRef = value;
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
