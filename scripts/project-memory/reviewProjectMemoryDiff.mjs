import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyRiskyCategories,
  classifyStrongerArtifacts,
  getTodayIsoDate,
  loadEntries,
  normalizeRepoRelativePath,
  repoRoot,
  scopeContainsPath,
} from './projectMemoryUtils.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';

const usage = `Usage:
  pnpm memory:task:review [--staged | --base <ref>] [--require-task-start] [--memory-resolution keep:<memory-path>] [--state-file <path>] [--json]

Examples:
  pnpm memory:task:review
  pnpm memory:task:review --staged
  pnpm memory:task:review --base origin/main --require-task-start
  pnpm memory:task:review --memory-resolution keep:promoted/2026-04-12-vfs-directory-reread-after-create.md`;

const runGitCommand = (args) => {
  const output = execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return output
    .split('\n')
    .map((line) => normalizeRepoRelativePath(line))
    .filter(Boolean);
};

const getChangedPaths = ({ staged = false, base } = {}) => {
  if (base) {
    return [
      ...new Set(runGitCommand(['diff', '--name-only', '--diff-filter=ACMRD', `${base}...HEAD`])),
    ];
  }

  if (staged) {
    return [...new Set(runGitCommand(['diff', '--cached', '--name-only', '--diff-filter=ACMRD']))];
  }

  return [
    ...new Set([
      ...runGitCommand(['diff', '--name-only', '--diff-filter=ACMRD', 'HEAD']),
      ...runGitCommand(['ls-files', '--others', '--exclude-standard']),
    ]),
  ];
};

const parseArgs = (rawArgs) => {
  const args = rawArgs.slice(2);
  let staged = false;
  let base;
  let requireTaskStart = false;
  let json = false;
  let stateFilePath = defaultTaskStatePath;
  const memoryResolutions = [];

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--staged') {
      staged = true;
      continue;
    }

    if (arg === '--base') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --base');
      }

      base = value;
      index += 1;
      continue;
    }

    if (arg === '--require-task-start') {
      requireTaskStart = true;
      continue;
    }

    if (arg === '--json') {
      json = true;
      continue;
    }

    if (arg === '--memory-resolution') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --memory-resolution');
      }

      memoryResolutions.push(value);
      index += 1;
      continue;
    }

    if (arg === '--state-file') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --state-file');
      }

      stateFilePath = path.isAbsolute(value) ? value : path.join(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (staged && base) {
    throw new Error('Use either --staged or --base, not both.');
  }

  return {
    staged,
    base,
    requireTaskStart,
    json,
    stateFilePath,
    memoryResolutions,
  };
};

const parseResolutions = (memoryResolutions) => {
  const keep = new Set();

  memoryResolutions.forEach((resolution) => {
    if (!resolution.startsWith('keep:')) {
      throw new Error(`Unsupported memory resolution: ${resolution}`);
    }

    const target = resolution.slice('keep:'.length).trim();

    if (target === '') {
      throw new Error(`Memory resolution is missing a target: ${resolution}`);
    }

    keep.add(target);
  });

  return {
    keep,
  };
};

const readTaskState = (stateFilePath) => {
  if (!fs.existsSync(stateFilePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
};

export const analyzeProjectMemoryDiff = (options) => {
  const changedPaths = Array.isArray(options.changedPaths)
    ? [...new Set(options.changedPaths.map(normalizeRepoRelativePath).filter(Boolean))]
    : getChangedPaths(options);
  const changedMemoryPaths = changedPaths.filter((filePath) =>
    filePath.startsWith('.project-memory/'),
  );
  const changedNonMemoryPaths = changedPaths.filter(
    (filePath) => !filePath.startsWith('.project-memory/'),
  );
  const state = readTaskState(options.stateFilePath);
  const resolutions = parseResolutions(options.memoryResolutions ?? []);
  const entries = loadEntries();
  const entryByRelativePath = new Map(entries.map((entry) => [entry.relativePath, entry]));
  const relatedEntries = entries
    .filter((entry) => entry.data.status !== 'archived')
    .map((entry) => {
      const touchedFiles = changedNonMemoryPaths.filter((filePath) =>
        Array.isArray(entry.data.scope)
          ? entry.data.scope.some((scope) => scopeContainsPath(scope, filePath))
          : false,
      );

      return touchedFiles.length > 0
        ? {
            entry,
            touchedFiles,
          }
        : undefined;
    })
    .filter(Boolean);
  const changedMemoryEntries = changedMemoryPaths
    .map((relativePath) => entryByRelativePath.get(relativePath))
    .filter(Boolean);
  const linkedHandledEntries = new Set();
  const handledByMemoryChange = new Set();
  const handledByResolution = new Set();
  const todayIsoDate = getTodayIsoDate();
  const failures = [];
  const warnings = [];

  changedMemoryEntries.forEach((memoryEntry) => {
    linkedHandledEntries.add(memoryEntry.memoryRelativePath);

    ['supersedes', 'superseded-by'].forEach((fieldName) => {
      const relatedPaths = Array.isArray(memoryEntry.data[fieldName])
        ? memoryEntry.data[fieldName]
        : [];

      relatedPaths.forEach((memoryRelativePath) => {
        linkedHandledEntries.add(memoryRelativePath);
      });
    });
  });

  relatedEntries.forEach(({ entry }) => {
    if (
      linkedHandledEntries.has(entry.memoryRelativePath) ||
      changedMemoryPaths.includes(entry.relativePath)
    ) {
      handledByMemoryChange.add(entry.memoryRelativePath);
      return;
    }

    if (resolutions.keep.has(entry.memoryRelativePath)) {
      handledByResolution.add(entry.memoryRelativePath);
    }
  });

  const riskyFileMatches = changedNonMemoryPaths
    .map((filePath) => ({
      filePath,
      categories: classifyRiskyCategories(filePath),
      strongerArtifacts: classifyStrongerArtifacts(filePath),
    }))
    .filter(({ categories }) => categories.length > 0);

  if (
    options.requireTaskStart &&
    (riskyFileMatches.length > 0 || relatedEntries.length > 0) &&
    !state
  ) {
    failures.push(
      'Project-memory task start state is missing. Run `pnpm memory:task:start --scope <path> --term <keyword>` before risky work.',
    );
  }

  relatedEntries.forEach(({ entry, touchedFiles }) => {
    if (
      !handledByMemoryChange.has(entry.memoryRelativePath) &&
      !handledByResolution.has(entry.memoryRelativePath)
    ) {
      failures.push(
        `Touched existing memory scope without lifecycle handling: ${entry.relativePath} via ${touchedFiles.join(
          ', ',
        )}. Refresh it, promote/archive it, or pass --memory-resolution keep:${entry.memoryRelativePath} during local task finish.`,
      );
      return;
    }

    if (
      handledByMemoryChange.has(entry.memoryRelativePath) &&
      entry.data.status !== 'archived' &&
      entry.data['last-verified-at'] !== todayIsoDate
    ) {
      failures.push(
        `${entry.relativePath} changed as part of memory lifecycle handling but last-verified-at is ${entry.data['last-verified-at']}. Refresh it to ${todayIsoDate} or archive the record.`,
      );
    }

    const touchedStrongerArtifacts = touchedFiles
      .map((filePath) => ({
        filePath,
        kinds: classifyStrongerArtifacts(filePath),
      }))
      .filter(({ kinds }) => kinds.length > 0);

    if (
      touchedStrongerArtifacts.length > 0 &&
      !handledByMemoryChange.has(entry.memoryRelativePath)
    ) {
      warnings.push(
        `Stronger artifact changed in ${entry.relativePath} scope (${touchedStrongerArtifacts
          .map(({ filePath, kinds }) => `${filePath} [${kinds.join(', ')}]`)
          .join(', ')}) but the memory record was not updated or promoted.`,
      );
    }
  });

  if (
    riskyFileMatches.length > 0 &&
    relatedEntries.length === 0 &&
    changedMemoryPaths.length === 0
  ) {
    warnings.push(
      `Risky diff touched ${[
        ...new Set(riskyFileMatches.flatMap(({ categories }) => categories)),
      ].join(
        ', ',
      )} without a matching memory record. Create a new draft only if the diff establishes a reusable rule not already discoverable in AGENTS, tests, guards, adapters, migrations, or code.`,
    );
  }

  return {
    changedPaths,
    changedMemoryPaths,
    changedNonMemoryPaths,
    failures,
    warnings,
    relatedEntries,
    riskyFileMatches,
    handledByMemoryChange,
    handledByResolution,
    state,
    stateFilePath: options.stateFilePath,
  };
};

export const renderProjectMemoryDiffReview = (result) => {
  const lines = [
    'Project memory diff review',
    '',
    `Changed files: ${result.changedPaths.length}`,
    ...result.changedPaths.slice(0, 20).map((filePath) => `- ${filePath}`),
  ];

  if (result.changedPaths.length > 20) {
    lines.push(`- ... ${result.changedPaths.length - 20} more`);
  }

  lines.push('');
  lines.push(
    `Task state: ${result.state ? path.relative(repoRoot, result.stateFilePath) : 'missing'}`,
  );

  if (result.state) {
    lines.push(
      `State scopes: ${Array.isArray(result.state.lookupScopes) ? result.state.lookupScopes.join(', ') : 'none'}`,
    );
    lines.push(
      `State terms: ${Array.isArray(result.state.taskTerms) && result.state.taskTerms.length > 0 ? result.state.taskTerms.join(', ') : 'none'}`,
    );
  }

  if (result.riskyFileMatches.length > 0) {
    lines.push('');
    lines.push('Risky files:');
    result.riskyFileMatches.forEach(({ filePath, categories }) => {
      lines.push(`- ${filePath} [${categories.join(', ')}]`);
    });
  }

  if (result.relatedEntries.length > 0) {
    lines.push('');
    lines.push('Related memory entries:');
    result.relatedEntries.forEach(({ entry, touchedFiles }) => {
      const handling = result.handledByMemoryChange.has(entry.memoryRelativePath)
        ? 'handled-by-memory-change'
        : result.handledByResolution.has(entry.memoryRelativePath)
          ? 'handled-by-explicit-keep'
          : 'unhandled';

      lines.push(`- ${entry.relativePath} [${handling}] via ${touchedFiles.join(', ')}`);
    });
  }

  if (result.failures.length > 0) {
    lines.push('');
    lines.push('Failures:');
    result.failures.forEach((failure) => {
      lines.push(`- ${failure}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    result.warnings.forEach((warning) => {
      lines.push(`- ${warning}`);
    });
  }

  if (result.failures.length === 0 && result.warnings.length === 0) {
    lines.push('');
    lines.push('No project-memory issues detected for the current diff.');
  }

  return lines.join('\n');
};

export const toJsonFriendlyProjectMemoryDiffReview = (result) => ({
  ...result,
  handledByMemoryChange: [...result.handledByMemoryChange],
  handledByResolution: [...result.handledByResolution],
});

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  try {
    const options = parseArgs(process.argv);
    const result = analyzeProjectMemoryDiff(options);

    if (options.json) {
      console.log(JSON.stringify(toJsonFriendlyProjectMemoryDiffReview(result), null, 2));
    } else {
      console.log(renderProjectMemoryDiffReview(result));
    }

    if (result.failures.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(usage);
    process.exit(1);
  }
}
