import fs from 'node:fs';

function replaceOnce(filePath, label, before, after) {
  const source = fs.readFileSync(filePath, 'utf8');
  const firstIndex = source.indexOf(before);

  if (firstIndex === -1) {
    throw new Error(`[verify-consistency-fix] missing expected ${label} in ${filePath}`);
  }

  if (source.indexOf(before, firstIndex + before.length) !== -1) {
    throw new Error(`[verify-consistency-fix] expected exactly one ${label} in ${filePath}`);
  }

  fs.writeFileSync(filePath, source.replace(before, after), 'utf8');
}

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  'shell formatter',
  `function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return \`'\${value.replaceAll("'", "'\\\\''")}'\`;
}`,
  `export function quoteShellArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  return \`'\${value.replaceAll("'", "'\\\\''")}'\`;
}

export function formatShellCommand(command, args = []) {
  return [command, ...args].map(quoteShellArg).join(' ');
}`,
);

replaceOnce(
  'scripts/lib/verifyInvocation.mjs',
  'invocation command rendering',
  `  return ['pnpm', 'verify', ...args].map(quoteShellArg).join(' ');`,
  `  return formatShellCommand('pnpm', ['verify', ...args]);`,
);

replaceOnce(
  'scripts/verify.mjs',
  'shell formatter import',
  `  FIX_ONLY_LABELS,
  formatVerifyInvocationCommand,`,
  `  FIX_ONLY_LABELS,
  formatShellCommand,
  formatVerifyInvocationCommand,`,
);

replaceOnce(
  'scripts/verify.mjs',
  'local shell formatter',
  `function quoteArg(value) {
  if (/^[A-Za-z0-9_./:-]+$/.test(value)) {
    return value;
  }

  const singleQuote = String.fromCharCode(39);
  const escapedSingleQuote = singleQuote + '\\\\' + singleQuote + singleQuote;
  return singleQuote + value.replaceAll(singleQuote, escapedSingleQuote) + singleQuote;
}

function formatCommand(command, args) {
  return [command, ...args].map(quoteArg).join(' ');
}`,
  `function formatCommand(command, args) {
  return formatShellCommand(command, args);
}`,
);

replaceOnce(
  'scripts/verify.mjs',
  'fix mode help',
  `  console.log('  --fix               Apply supported format/lint fixes, then run verification.');
  console.log('  --fix-only          Apply supported format/lint fixes only.');
  console.log(
    \`                      With --only, accepted labels: \${[...FIX_ONLY_LABELS].join(', ')}.\`,
  );`,
  `  console.log('  --fix               Apply supported format/lint fixes, then run verification.');
  console.log('  --fix-only          Apply supported format/lint fixes only.');
  console.log(
    \`                      With either fix mode and --only, accepted labels: \${[...FIX_ONLY_LABELS].join(', ')}.\`,
  );`,
);

replaceOnce(
  '.agents/skills/verification/SKILL.md',
  'fix mode constraint',
  '- `--fix-only --only` is limited to `agent-environment`, `format`, `oxlint`, and `eslint`, the checks that actually execute in fix-only mode.',
  '- `--fix --only` and `--fix-only --only` are limited to `agent-environment`, `format`, `oxlint`, and `eslint`, the checks that can apply supported fixers.',
);

replaceOnce(
  'docs/testing/migration-plan.md',
  'scope ownership description',
  '`scripts/lib/changedPaths.mjs` now owns a repository-wide, status-aware changed-path model (see Phase 1, step 1, below). Local, local-base, and GitHub Actions planning all use NUL-delimited `git diff --name-status` output, preserve deleted paths, and expose both sides of a rename. `--files` remains an explicit existing-path override handled separately from Git diff planning.',
  '`scripts/lib/verifyInvocation.mjs` owns effective invocation precedence and resolves full, explicit-files, GitHub-base, local-base, and local scopes. For non-full scopes, `scripts/lib/changedPaths.mjs` owns the repository-wide, status-aware Git changed-path model (see Phase 1, step 1, below). Git-backed planning uses NUL-delimited `git diff --name-status` output, preserves deleted paths, and exposes both sides of a rename. `--files` remains an explicit existing-path override handled separately from Git diff planning.',
);

replaceOnce(
  'docs/testing/migration-plan.md',
  'verify changed-path execution description',
  'It uses NUL-delimited, status-aware Git output (`git diff --name-status -z --find-renames --diff-filter=ADMRT`) for local, local-base (fork-point), and GitHub Actions (merge-base) planning, and preserves `packageJsonOldRef` package comparison support for every scope. `scripts/verify.mjs` calls `resolveChangedPathsScope()` for scope resolution and `getChangedFileProjection()` to obtain the transitional string-path list its current command planners still consume (see "Diff planning" above).',
  'It uses NUL-delimited, status-aware Git output (`git diff --name-status -z --find-renames --diff-filter=ADMRT`) for local, local-base (fork-point), and GitHub Actions (merge-base) planning, and preserves `packageJsonOldRef` package comparison support for every Git-backed scope. `scripts/verify.mjs` consumes the invocation resolved by `verifyInvocation`, calls `resolveChangedPathsScope()` only for non-full changed-path execution, and uses `getChangedFileProjection()` to obtain the transitional string-path list its current command planners still consume (see "Diff planning" above).',
);

console.log('[verify-consistency-fix] updated verify help, shell formatting, skill, and migration ownership');
