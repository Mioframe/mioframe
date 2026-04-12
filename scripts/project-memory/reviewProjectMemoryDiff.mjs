import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  classifyRiskyCategories,
  classifyStrongerArtifacts,
  correctionLikeKinds,
  getTodayIsoDate,
  loadEntries,
  normalizeRepoRelativePath,
  repoRoot,
  scopeContainsPath,
} from './projectMemoryUtils.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';

const usage = `Usage:
  pnpm memory:task:review [--staged | --base <ref>] [--require-task-start] [--strict] [--memory-resolution keep:<memory-path>] [--learning-resolution record:<memory-path>] [--learning-resolution covered-by:<artifact-path>] [--state-file <path>] [--json]

Examples:
  pnpm memory:task:review
  pnpm memory:task:review --staged
  pnpm memory:task:review --strict --require-task-start --learning-resolution covered-by:src/shared/lib/typeGuards/isDirectoryHandle.ts
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
  let strict = false;
  let json = false;
  let stateFilePath = defaultTaskStatePath;
  const memoryResolutions = [];
  const learningResolutions = [];

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

    if (arg === '--strict') {
      strict = true;
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

    if (arg === '--learning-resolution') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --learning-resolution');
      }

      learningResolutions.push(value);
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
    strict,
    json,
    stateFilePath,
    memoryResolutions,
    learningResolutions,
  };
};

const normalizeMemoryPathTarget = (value) =>
  normalizeRepoRelativePath(value).replace(/^\.project-memory\//u, '');

const parseMemoryResolutions = (memoryResolutions, entryByMemoryPath) => {
  const keep = new Set();

  memoryResolutions.forEach((resolution) => {
    if (!resolution.startsWith('keep:')) {
      throw new Error(`Unsupported memory resolution: ${resolution}`);
    }

    const target = normalizeMemoryPathTarget(resolution.slice('keep:'.length).trim());

    if (target === '') {
      throw new Error(`Memory resolution is missing a target: ${resolution}`);
    }

    if (!entryByMemoryPath.has(target)) {
      throw new Error(`Memory resolution points to a missing record: ${target}`);
    }

    keep.add(target);
  });

  return {
    keep,
  };
};

const parseLearningResolutions = (learningResolutions, entryByRelativePath) => {
  const record = new Set();
  const coveredBy = new Set();

  learningResolutions.forEach((resolution) => {
    const separatorIndex = resolution.indexOf(':');

    if (separatorIndex <= 0) {
      throw new Error(`Unsupported learning resolution: ${resolution}`);
    }

    const type = resolution.slice(0, separatorIndex);
    const rawTarget = resolution.slice(separatorIndex + 1).trim();

    if (rawTarget === '') {
      throw new Error(`Learning resolution is missing a target: ${resolution}`);
    }

    if (type === 'record') {
      const target = normalizeRepoRelativePath(rawTarget);

      if (!target.startsWith('.project-memory/')) {
        throw new Error(
          `record learning resolutions must point at a .project-memory entry: ${rawTarget}`,
        );
      }

      if (!entryByRelativePath.has(target)) {
        throw new Error(`record learning resolution points to a missing file: ${target}`);
      }

      record.add(target);
      return;
    }

    if (type === 'covered-by') {
      const target = normalizeRepoRelativePath(rawTarget);
      const artifactKinds = classifyStrongerArtifacts(target);

      if (!fs.existsSync(path.join(repoRoot, target))) {
        throw new Error(`covered-by learning resolution points to a missing file: ${target}`);
      }

      if (artifactKinds.length === 0) {
        throw new Error(
          `covered-by learning resolutions must point at a stronger artifact such as AGENTS.md, a test, a guard, an adapter, a migration, or a schema: ${target}`,
        );
      }

      coveredBy.add(target);
      return;
    }

    throw new Error(`Unsupported learning resolution: ${resolution}`);
  });

  return {
    record,
    coveredBy,
  };
};

const readTaskState = (stateFilePath) => {
  if (!fs.existsSync(stateFilePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'));
};

const doesFinishStateCoverCurrentPaths = (state, changedPaths) => {
  const finishedPaths = Array.isArray(state?.finish?.changedPaths)
    ? state.finish.changedPaths.map(normalizeRepoRelativePath).filter(Boolean)
    : [];

  if (!state?.finish?.completedAt || finishedPaths.length === 0) {
    return false;
  }

  return changedPaths.every((changedPath) => finishedPaths.includes(changedPath));
};

const getStoredLifecycleDecisions = (state, changedPaths) => {
  if (!doesFinishStateCoverCurrentPaths(state, changedPaths)) {
    return {
      valid: false,
      memoryResolutions: [],
      learningResolutions: [],
    };
  }

  return {
    valid: true,
    memoryResolutions: Array.isArray(state.finish.memoryResolutions)
      ? state.finish.memoryResolutions
      : [],
    learningResolutions: Array.isArray(state.finish.learningResolutions)
      ? state.finish.learningResolutions
      : [],
  };
};

const pushIssue = (collection, message) => {
  collection.push(message);
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
  const strictLifecycle = Boolean(options.strict || options.requireTaskStart);
  const entries = loadEntries();
  const entryByRelativePath = new Map(entries.map((entry) => [entry.relativePath, entry]));
  const entryByMemoryPath = new Map(entries.map((entry) => [entry.memoryRelativePath, entry]));
  const storedLifecycleDecisions = getStoredLifecycleDecisions(state, changedPaths);
  const memoryResolutions = parseMemoryResolutions(
    [
      ...(storedLifecycleDecisions.valid ? storedLifecycleDecisions.memoryResolutions : []),
      ...(options.memoryResolutions ?? []),
    ],
    entryByMemoryPath,
  );
  const learningResolutions = parseLearningResolutions(
    [
      ...(storedLifecycleDecisions.valid ? storedLifecycleDecisions.learningResolutions : []),
      ...(options.learningResolutions ?? []),
    ],
    entryByRelativePath,
  );
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

  const riskyFileMatches = changedNonMemoryPaths
    .map((filePath) => ({
      filePath,
      categories: classifyRiskyCategories(filePath),
    }))
    .filter(({ categories }) => categories.length > 0);

  const strongerArtifactMatches = changedNonMemoryPaths
    .map((filePath) => ({
      filePath,
      kinds: classifyStrongerArtifacts(filePath),
    }))
    .filter(({ kinds }) => kinds.length > 0);

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

    if (memoryResolutions.keep.has(entry.memoryRelativePath)) {
      handledByResolution.add(entry.memoryRelativePath);
    }
  });

  const reportLifecycleIssue = (message) => {
    pushIssue(strictLifecycle ? failures : warnings, message);
  };

  if (
    options.requireTaskStart &&
    (riskyFileMatches.length > 0 || relatedEntries.length > 0) &&
    !state
  ) {
    reportLifecycleIssue(
      'Project-memory task start state is missing. Run `pnpm memory:task:start --scope <path> --term <keyword>` before risky work.',
    );
  }

  if (
    state?.finish?.completedAt &&
    !storedLifecycleDecisions.valid &&
    changedPaths.length > 0 &&
    strictLifecycle
  ) {
    reportLifecycleIssue(
      'The diff changed after the last `pnpm memory:task:finish`. Rerun `pnpm memory:task:finish` so lifecycle and learning decisions match the current diff.',
    );
  }

  relatedEntries.forEach(({ entry, touchedFiles }) => {
    const touchedStrongerArtifacts = touchedFiles
      .map((filePath) => ({
        filePath,
        kinds: classifyStrongerArtifacts(filePath),
      }))
      .filter(({ kinds }) => kinds.length > 0);

    if (
      !handledByMemoryChange.has(entry.memoryRelativePath) &&
      !handledByResolution.has(entry.memoryRelativePath)
    ) {
      reportLifecycleIssue(
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
      reportLifecycleIssue(
        `${entry.relativePath} changed as part of memory lifecycle handling but last-verified-at is ${entry.data['last-verified-at']}. Refresh it to ${todayIsoDate} or archive the record.`,
      );
    }

    if (
      correctionLikeKinds.has(entry.data.kind) &&
      entry.data.status !== 'promoted' &&
      entry.data.status !== 'archived' &&
      (entry.data.status === 'verified' || touchedStrongerArtifacts.length > 0) &&
      !handledByMemoryChange.has(entry.memoryRelativePath)
    ) {
      reportLifecycleIssue(
        `Repeated correction-style lesson is still only prose memory: ${entry.relativePath}. This scope was touched again${touchedStrongerArtifacts.length > 0 ? ` and stronger artifacts changed in ${touchedStrongerArtifacts.map(({ filePath }) => filePath).join(', ')}` : ''}. Promote it to a stronger artifact or archive it with a replacement breadcrumb instead of keeping it as prose.`,
      );
    }

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

  const learningSignals = [];

  if (strongerArtifactMatches.length > 0) {
    learningSignals.push(
      `stronger artifacts changed: ${strongerArtifactMatches
        .map(({ filePath, kinds }) => `${filePath} [${kinds.join(', ')}]`)
        .join(', ')}`,
    );
  }

  const relatedCorrectionEntries = relatedEntries.filter(({ entry }) =>
    correctionLikeKinds.has(entry.data.kind),
  );

  if (relatedCorrectionEntries.length > 0) {
    learningSignals.push(
      `correction-style lessons matched this scope: ${relatedCorrectionEntries
        .map(({ entry }) => entry.relativePath)
        .join(', ')}`,
    );
  }

  if (
    riskyFileMatches.length > 0 &&
    relatedEntries.length === 0 &&
    changedMemoryPaths.length === 0
  ) {
    learningSignals.push(
      `risky diff without existing memory breadcrumb: ${[
        ...new Set(riskyFileMatches.flatMap(({ categories }) => categories)),
      ].join(', ')}`,
    );
  }

  const learningCaptureSatisfied =
    changedMemoryPaths.length > 0 ||
    learningResolutions.record.size > 0 ||
    learningResolutions.coveredBy.size > 0;

  if (strictLifecycle && learningSignals.length > 0 && !learningCaptureSatisfied) {
    failures.push(
      `Explicit learning capture is required for this task because ${learningSignals.join(
        '; ',
      )}. Either update/create a .project-memory entry in the diff, or finish with --learning-resolution covered-by:<artifact-path> when the lesson is already better expressed in a stronger artifact.`,
    );
  }

  if (
    riskyFileMatches.length > 0 &&
    relatedEntries.length === 0 &&
    changedMemoryPaths.length === 0 &&
    !learningCaptureSatisfied
  ) {
    warnings.push(
      `Risky diff touched ${[
        ...new Set(riskyFileMatches.flatMap(({ categories }) => categories)),
      ].join(
        ', ',
      )} without a matching memory record. Capture a reusable lesson only when the diff proves it, otherwise finish with --learning-resolution covered-by:<artifact-path> when a stronger artifact already carries the rule.`,
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
    strongerArtifactMatches,
    learningSignals,
    learningCaptureSatisfied,
    handledByMemoryChange,
    handledByResolution,
    memoryResolutions,
    learningResolutions,
    state,
    stateFilePath: options.stateFilePath,
    strictLifecycle,
    storedLifecycleDecisions,
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

    if (result.state.finish?.completedAt) {
      lines.push(`Last finish: ${result.state.finish.completedAt}`);
      lines.push(
        `Stored finish decisions reused: ${result.storedLifecycleDecisions.valid ? 'yes' : 'no'}`,
      );
    }
  }

  if (result.riskyFileMatches.length > 0) {
    lines.push('');
    lines.push('Risky files:');
    result.riskyFileMatches.forEach(({ filePath, categories }) => {
      lines.push(`- ${filePath} [${categories.join(', ')}]`);
    });
  }

  if (result.strongerArtifactMatches.length > 0) {
    lines.push('');
    lines.push('Stronger artifacts:');
    result.strongerArtifactMatches.forEach(({ filePath, kinds }) => {
      lines.push(`- ${filePath} [${kinds.join(', ')}]`);
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

  if (result.learningSignals.length > 0) {
    lines.push('');
    lines.push('Learning signals:');
    result.learningSignals.forEach((signal) => {
      lines.push(`- ${signal}`);
    });
    lines.push(`Learning capture satisfied: ${result.learningCaptureSatisfied ? 'yes' : 'no'}`);
  }

  const explicitLearningDecisions = [
    ...result.learningResolutions.record,
    ...result.learningResolutions.coveredBy,
  ];

  if (explicitLearningDecisions.length > 0) {
    lines.push('');
    lines.push('Explicit learning resolutions:');
    explicitLearningDecisions.forEach((decision) => {
      lines.push(`- ${decision}`);
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
  memoryResolutions: {
    keep: [...result.memoryResolutions.keep],
  },
  learningResolutions: {
    record: [...result.learningResolutions.record],
    coveredBy: [...result.learningResolutions.coveredBy],
  },
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
