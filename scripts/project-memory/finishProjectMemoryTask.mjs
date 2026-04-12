import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import { recordOutcomeFeedback, writeUsageStats } from './projectMemoryBehavior.mjs';
import {
  analyzeProjectMemoryDiff,
  renderProjectMemoryDiffReview,
} from './reviewProjectMemoryDiff.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';
import {
  lastTaskFinishPath,
  loadEntries,
  loadUsageStats,
  readActiveTaskState,
  repoRoot,
  usageStatsPath,
} from './projectMemoryUtils.mjs';

const usage = `Usage:
  pnpm memory:task:finish [--staged | --base <ref>] [--memory-resolution keep:<memory-path>] [--learning-resolution covered-by:<artifact-path>] [--state-file <path>] [--finish-file <path>]

Examples:
  pnpm memory:task:finish
  pnpm memory:task:finish --memory-resolution keep:promoted/2026-04-12-vfs-directory-reread-after-create.md
  pnpm memory:task:finish --learning-resolution covered-by:src/shared/lib/typeGuards/isDirectoryHandle.ts
  pnpm memory:task:finish --base origin/main`;

const parseArgs = (rawArgs) => {
  const args = rawArgs.slice(2);
  let staged = false;
  let base;
  let stateFilePath = defaultTaskStatePath;
  let finishFilePath = lastTaskFinishPath;
  let statsFilePath = usageStatsPath;
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

    if (arg === '--finish-file') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --finish-file');
      }

      finishFilePath = path.isAbsolute(value) ? value : path.join(repoRoot, value);
      index += 1;
      continue;
    }

    if (arg === '--stats-file') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --stats-file');
      }

      statsFilePath = path.isAbsolute(value) ? value : path.join(repoRoot, value);
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
    stateFilePath,
    finishFilePath,
    statsFilePath,
    memoryResolutions,
    learningResolutions,
  };
};

const runMemoryValidate = () => {
  const result = spawnSync('pnpm', ['memory:validate'], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  return {
    ok: result.status === 0,
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
};

try {
  const options = parseArgs(process.argv);
  const activeState = readActiveTaskState(options.stateFilePath);

  if (!activeState) {
    throw new Error(
      'Active project-memory task state is missing. Run `pnpm memory:task:start --scope <path> --term <keyword>` before `pnpm memory:task:finish`.',
    );
  }

  const review = analyzeProjectMemoryDiff({
    ...options,
    requireTaskStart: true,
    strict: true,
  });
  const entries = loadEntries();
  const usageStats = loadUsageStats(options.statsFilePath);
  const validation = runMemoryValidate();

  console.log(renderProjectMemoryDiffReview(review));
  console.log('');
  console.log('Project memory validation');
  console.log('');
  console.log(validation.output || 'pnpm memory:validate completed with no output.');

  if (!validation.ok) {
    review.failures.push('`pnpm memory:validate` failed.');
  }

  if (review.failures.length > 0) {
    process.exit(1);
  }

  const finishState = {
    version: 4,
    status: 'completed',
    completedAt: new Date().toISOString(),
    exactScopes: activeState.exactScopes,
    parentScopes: activeState.parentScopes,
    boundaryScopes: activeState.boundaryScopes,
    lookupScopes: activeState.lookupScopes,
    taskTerms: activeState.taskTerms,
    matchedEntries: activeState.matchedEntries,
    changedPaths: review.changedPaths,
    changedMemoryEntryPaths: review.changedMemoryEntryPaths,
    memoryResolutions: options.memoryResolutions,
    learningResolutions: options.learningResolutions,
    shownDigestEntryPaths: activeState.shownDigestEntryPaths ?? [],
    learningCandidate: review.learningCandidate,
  };

  const relatedEntryPaths = review.relatedEntries.map(({ entry }) => entry.memoryRelativePath);
  const shownEntryPaths = activeState.shownDigestEntryPaths ?? [];
  const usedEntryPaths = shownEntryPaths.filter((entryPath) =>
    relatedEntryPaths.includes(entryPath),
  );
  const falsePositiveEntryPaths = shownEntryPaths.filter(
    (entryPath) =>
      !relatedEntryPaths.includes(entryPath) &&
      !review.triggerMatches.some(({ entry }) => entry.memoryRelativePath === entryPath),
  );
  const repeatedEntryPaths = review.relatedEntries
    .filter(
      ({ entry }) =>
        review.failures.some((failure) => failure.includes(entry.relativePath)) ||
        review.warnings.some((warning) => warning.includes(entry.relativePath)),
    )
    .map(({ entry }) => entry.memoryRelativePath);
  const preventedEntryPaths = review.relatedEntries
    .filter(
      ({ entry }) =>
        shownEntryPaths.includes(entry.memoryRelativePath) &&
        (review.handledByMemoryChange.has(entry.memoryRelativePath) ||
          review.learningResolutions.coveredBy.size > 0),
    )
    .map(({ entry }) => entry.memoryRelativePath);

  recordOutcomeFeedback({
    usageStats,
    entries,
    shownEntryPaths,
    usedEntryPaths,
    falsePositiveEntryPaths,
    repeatedEntryPaths,
    preventedEntryPaths,
    nowIso: finishState.completedAt,
  });

  fs.mkdirSync(path.dirname(options.finishFilePath), { recursive: true });
  fs.writeFileSync(options.finishFilePath, `${JSON.stringify(finishState, null, 2)}\n`, 'utf8');
  writeUsageStats(options.statsFilePath, usageStats);

  if (fs.existsSync(options.stateFilePath)) {
    fs.rmSync(options.stateFilePath);
  }

  if (review.learningCandidate?.resolution === 'candidate') {
    console.log('');
    console.log('Suggested learning candidate draft');
    console.log('');
    console.log(review.learningCandidate.draftText);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('');
  console.error(usage);
  process.exit(1);
}
