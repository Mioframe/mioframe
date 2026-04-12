import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { renderMemoryDigest } from './projectMemoryBehavior.mjs';
import { buildProjectMemoryLookup } from './projectMemoryUtils.mjs';

const usage = `Usage:
  pnpm memory:lookup --scope <path> [--scope <path>] [--term <keyword>] [--include-archived] [--expanded] [--json]

Examples:
  pnpm memory:lookup --scope src/shared/service/fileSystem --term reread
  pnpm memory:lookup --scope src/shared/lib/changeObject --term deepPatchJsonObject`;

export const lookupProjectMemory = ({
  scopeQueries = [],
  termQueries = [],
  includeArchived = false,
} = {}) => {
  return buildProjectMemoryLookup({
    scopeQueries,
    termQueries,
    includeArchived,
  });
};

export const renderProjectMemoryLookup = (result, { expanded = false } = {}) => {
  if (result.rankedEntries.length === 0) {
    return 'No matching project-memory entries found.';
  }

  const digest = renderMemoryDigest(result.rankedEntries, {
    expanded,
  });

  return [
    `Matched ${result.rankedEntries.length} project-memory entr${result.rankedEntries.length === 1 ? 'y' : 'ies'}:`,
    '',
    ...digest.lines,
  ].join('\n');
};

const parseArgs = (rawArgs) => {
  const args = rawArgs.slice(2);
  const scopeQueries = [];
  const termQueries = [];
  let includeArchived = false;
  let expanded = false;
  let json = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--scope') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --scope');
      }

      scopeQueries.push(value);
      index += 1;
      continue;
    }

    if (arg === '--term') {
      const value = args[index + 1];

      if (!value) {
        throw new Error('Expected a value after --term');
      }

      termQueries.push(value);
      index += 1;
      continue;
    }

    if (arg === '--include-archived') {
      includeArchived = true;
      continue;
    }

    if (arg === '--expanded') {
      expanded = true;
      continue;
    }

    if (arg === '--json') {
      json = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(usage);
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  if (scopeQueries.length === 0 && termQueries.length === 0) {
    throw new Error('Provide at least one --scope or --term query.');
  }

  return {
    scopeQueries,
    termQueries,
    includeArchived,
    expanded,
    json,
  };
};

const isMainModule =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isMainModule) {
  try {
    const options = parseArgs(process.argv);
    const result = lookupProjectMemory(options);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(renderProjectMemoryLookup(result, options));
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error('');
    console.error(usage);
    process.exit(1);
  }
}
