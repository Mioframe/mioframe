import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  asNonEmptyString,
  getParentScope,
  loadEntries,
  normalizeRepoRelativePath,
  rankEntries,
  repoRoot,
} from './projectMemoryUtils.mjs';

export const defaultTaskStatePath = path.join(
  repoRoot,
  '.project-memory',
  '.task-state',
  'current-task.json',
);

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

  const exactScopes = [...new Set(scopes.map(normalizeRepoRelativePath).filter(Boolean))];
  const parentScopes = [...new Set(exactScopes.map(getParentScope).filter(Boolean))];
  const normalizedTerms = [...new Set(terms.map((term) => asNonEmptyString(term)).filter(Boolean))];

  if (exactScopes.length === 0) {
    throw new Error('Provide at least one --scope query.');
  }

  return {
    exactScopes,
    parentScopes,
    lookupScopes: [...new Set([...exactScopes, ...parentScopes])],
    terms: normalizedTerms,
    noSave,
    stateFilePath,
  };
};

const renderEntries = (rankedEntries) => {
  if (rankedEntries.length === 0) {
    return ['No matching project-memory entries found.'];
  }

  return [
    `Matched ${rankedEntries.length} project-memory entr${rankedEntries.length === 1 ? 'y' : 'ies'}:`,
    ...rankedEntries.slice(0, 12).flatMap(({ entry, score, reasons }) => {
      const scope = Array.isArray(entry.data.scope) ? entry.data.scope.join(', ') : 'unknown scope';

      return [
        '',
        `- ${entry.relativePath} [status=${entry.data.status}, score=${score}, reasons=${[
          ...new Set(reasons),
        ].join(', ')}]`,
        `  scope: ${scope}`,
        `  rule: ${entry.data.rule}`,
        ...(entry.body ? [`  note: ${entry.body}`] : []),
      ];
    }),
  ];
};

export const startProjectMemoryTask = (options) => {
  const rankedEntries = rankEntries(loadEntries(), {
    scopeQueries: options.lookupScopes,
    termQueries: options.terms,
  });
  const state = {
    version: 2,
    startedAt: new Date().toISOString(),
    exactScopes: options.exactScopes,
    parentScopes: options.parentScopes,
    lookupScopes: options.lookupScopes,
    taskTerms: options.terms,
    matchedEntries: rankedEntries.slice(0, 20).map(({ entry }) => entry.memoryRelativePath),
    finish: null,
  };

  if (!options.noSave) {
    fs.mkdirSync(path.dirname(options.stateFilePath), { recursive: true });
    fs.writeFileSync(options.stateFilePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }

  const lines = [
    'Project memory task start',
    '',
    `Exact scopes: ${options.exactScopes.join(', ')}`,
    `Parent scopes: ${options.parentScopes.length > 0 ? options.parentScopes.join(', ') : 'none'}`,
    `Task terms: ${options.terms.length > 0 ? options.terms.join(', ') : 'none'}`,
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
