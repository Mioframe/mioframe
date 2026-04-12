import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  recordShownDigests,
  renderMemoryDigest,
  writeUsageStats,
} from './projectMemoryBehavior.mjs';
import {
  buildProjectMemoryLookup,
  currentTaskStatePath,
  loadEntries,
  loadUsageStats,
  repoRoot,
  usageStatsPath,
  writeActiveTaskState,
} from './projectMemoryUtils.mjs';

export const defaultTaskStatePath = currentTaskStatePath;

const usage = `Usage:
  pnpm memory:task:start --scope <path> [--scope <path>] [--term <keyword>] [--state-file <path>] [--no-save]

Examples:
  pnpm memory:task:start --scope src/shared/service/fileSystem --term reread --term handle
  pnpm memory:task:start --scope scripts/project-memory --term workflow --term diff`;

const parseArgs = (rawArgs) => {
  const args = rawArgs.slice(2);
  const scopes = [];
  const terms = [];
  let noSave = false;
  let stateFilePath = defaultTaskStatePath;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--scope') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --scope');
      }

      scopes.push(value);
      index += 1;
      continue;
    }

    if (arg === '--term') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --term');
      }

      terms.push(value);
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

    if (arg === '--no-save') {
      noSave = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  const lookup = buildProjectMemoryLookup({
    scopeQueries: scopes,
    termQueries: terms,
    includeBoundaryScopes: true,
  });
  const exactScopes = lookup.scopeQueries;
  const parentScopes = lookup.parentScopeQueries;
  const boundaryScopes = lookup.boundaryScopeQueries;
  const normalizedTerms = lookup.termQueries;

  if (exactScopes.length === 0) {
    throw new Error('Provide at least one --scope query.');
  }

  return {
    exactScopes,
    parentScopes,
    boundaryScopes,
    lookupScopes: lookup.lookupScopes,
    terms: normalizedTerms,
    noSave,
    stateFilePath,
    usageStatsPath,
  };
};

const renderEntries = (rankedEntries) => {
  if (rankedEntries.length === 0) {
    return ['No matching project-memory entries found.'];
  }

  const digest = renderMemoryDigest(rankedEntries);

  return [
    `Matched ${rankedEntries.length} project-memory entr${rankedEntries.length === 1 ? 'y' : 'ies'}:`,
    '',
    ...digest.lines,
  ];
};

export const startProjectMemoryTask = (options) => {
  const usageStats = loadUsageStats(options.usageStatsPath);
  const lookup = buildProjectMemoryLookup({
    scopeQueries: options.exactScopes,
    termQueries: options.terms,
    usageStats,
  });
  const rankedEntries = lookup.rankedEntries;
  const digest = renderMemoryDigest(rankedEntries);
  const entryByPath = new Map(loadEntries().map((entry) => [entry.memoryRelativePath, entry]));
  const state = {
    version: 4,
    status: 'active',
    startedAt: new Date().toISOString(),
    exactScopes: lookup.scopeQueries,
    parentScopes: lookup.parentScopeQueries,
    boundaryScopes: lookup.boundaryScopeQueries,
    lookupScopes: lookup.lookupScopes,
    taskTerms: lookup.termQueries,
    matchedEntries: rankedEntries.slice(0, 20).map(({ entry }) => entry.memoryRelativePath),
    shownDigestEntryPaths: digest.renderedEntryPaths,
    digestCache: {
      mode: 'compact',
      entryPaths: digest.renderedEntryPaths,
      lineCount: digest.lines.length,
    },
  };

  if (!options.noSave) {
    writeActiveTaskState(state, options.stateFilePath);
    recordShownDigests({
      usageStats,
      entries: digest.renderedEntryPaths
        .map((entryPath) => entryByPath.get(entryPath))
        .filter(Boolean),
      nowIso: state.startedAt,
    });
    writeUsageStats(options.usageStatsPath, usageStats);
  }

  const lines = [
    'Project memory task start',
    '',
    `Exact scopes: ${lookup.scopeQueries.join(', ')}`,
    `Parent scopes: ${lookup.parentScopeQueries.length > 0 ? lookup.parentScopeQueries.join(', ') : 'none'}`,
    `Boundary scopes: ${lookup.boundaryScopeQueries.length > 0 ? lookup.boundaryScopeQueries.join(', ') : 'none'}`,
    `Task terms: ${lookup.termQueries.length > 0 ? lookup.termQueries.join(', ') : 'none'}`,
    ...(!options.noSave ? [`State file: ${path.relative(repoRoot, options.stateFilePath)}`] : []),
    '',
    ...renderEntries(rankedEntries),
  ];

  return {
    rankedEntries,
    state,
    output: lines.join('\n'),
  };
};

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  try {
    const options = parseArgs(process.argv);
    const result = startProjectMemoryTask(options);

    console.log(result.output);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(usage);
    process.exit(1);
  }
}
