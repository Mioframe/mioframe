import fs from 'node:fs';

const invocationPath = 'scripts/lib/verifyInvocation.mjs';
let invocationSource = fs.readFileSync(invocationPath, 'utf8');
const functionIndex = invocationSource.indexOf('function quoteShellArg(value) {');
const sectionEndMarker =
  '/**\n * Render a structured verify invocation as a canonical shell-safe command.';
const sectionEnd = invocationSource.indexOf(sectionEndMarker, functionIndex);

if (functionIndex === -1 || sectionEnd === -1) {
  throw new Error('[verify-formatter-repair] unable to locate formatter section');
}

const sectionStart = invocationSource.lastIndexOf('\n', functionIndex) + 1;
const canonicalSection = `export function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return \`'\${value.replaceAll("'", "'\\\\''")}'\`;
}

export function formatShellCommand(command, args = []) {
  return [command, ...args].map(quoteShellArg).join(' ');
}

`;

invocationSource =
  invocationSource.slice(0, sectionStart) + canonicalSection + invocationSource.slice(sectionEnd);
fs.writeFileSync(invocationPath, invocationSource, 'utf8');

const migrationPath = 'docs/testing/migration-plan.md';
let migrationSource = fs.readFileSync(migrationPath, 'utf8');
const oldOwnership =
  '`scripts/lib/changedPaths.mjs` now owns a repository-wide, status-aware changed-path model (see Phase 1, step 1, below). Local, local-base, and GitHub Actions planning all use NUL-delimited `git diff --name-status` output, preserve deleted paths, and expose both sides of a rename. `--files` remains an explicit existing-path override handled separately from Git diff planning.';
const newOwnership =
  '`scripts/lib/verifyInvocation.mjs` owns effective invocation precedence and resolves full, explicit-files, GitHub-base, local-base, and local scopes. For non-full scopes, `scripts/lib/changedPaths.mjs` owns the repository-wide, status-aware Git changed-path model (see Phase 1, step 1, below). Git-backed planning uses NUL-delimited `git diff --name-status` output, preserves deleted paths, and exposes both sides of a rename. `--files` remains an explicit existing-path override handled separately from Git diff planning.';
const oldExecution =
  'It uses NUL-delimited, status-aware Git output (`git diff --name-status -z --find-renames --diff-filter=ADMRT`) for local, local-base (fork-point), and GitHub Actions (merge-base) planning, and preserves `packageJsonOldRef` package comparison support for every scope. `scripts/verify.mjs` calls `resolveChangedPathsScope()` for scope resolution and `getChangedFileProjection()` to obtain the transitional string-path list its current command planners still consume (see "Diff planning" above).';
const newExecution =
  'It uses NUL-delimited, status-aware Git output (`git diff --name-status -z --find-renames --diff-filter=ADMRT`) for local, local-base (fork-point), and GitHub Actions (merge-base) planning, and preserves `packageJsonOldRef` package comparison support for every Git-backed scope. `scripts/verify.mjs` consumes the invocation resolved by `verifyInvocation`, calls `resolveChangedPathsScope()` only for non-full changed-path execution, and uses `getChangedFileProjection()` to obtain the transitional string-path list its current command planners still consume (see "Diff planning" above).';

if (migrationSource.includes(oldOwnership)) {
  migrationSource = migrationSource.replace(oldOwnership, newOwnership);
} else if (!migrationSource.includes(newOwnership)) {
  throw new Error('[verify-formatter-repair] unexpected migration ownership text');
}

if (migrationSource.includes(oldExecution)) {
  migrationSource = migrationSource.replace(oldExecution, newExecution);
} else if (!migrationSource.includes(newExecution)) {
  throw new Error('[verify-formatter-repair] unexpected migration execution text');
}

fs.writeFileSync(migrationPath, migrationSource, 'utf8');
console.log('[verify-formatter-repair] formatter and migration ownership repaired');
