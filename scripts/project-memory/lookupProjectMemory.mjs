import {
  asNonEmptyString,
  loadEntries,
  normalizeScopeEntry,
  tokenizeRule,
} from './projectMemoryUtils.mjs';

const args = process.argv.slice(2);
const scopeQueries = [];
const termQueries = [];
let includeArchived = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];

  if (arg === '--scope') {
    const value = args[index + 1];

    if (!value) {
      console.error('Expected a value after --scope');
      process.exit(1);
    }

    scopeQueries.push(value);
    index += 1;
    continue;
  }

  if (arg === '--term') {
    const value = args[index + 1];

    if (!value) {
      console.error('Expected a value after --term');
      process.exit(1);
    }

    termQueries.push(value);
    index += 1;
    continue;
  }

  if (arg === '--include-archived') {
    includeArchived = true;
    continue;
  }

  if (arg === '--help' || arg === '-h') {
    console.log(`Usage:
  pnpm memory:lookup --scope <path> [--scope <path>] [--term <keyword>] [--include-archived]

Examples:
  pnpm memory:lookup --scope src/shared/service/fileSystem --term reread
  pnpm memory:lookup --scope src/shared/lib/changeObject --term deepPatchJsonObject`);
    process.exit(0);
  }

  console.error(`Unknown argument: ${arg}`);
  process.exit(1);
}

if (scopeQueries.length === 0 && termQueries.length === 0) {
  console.error('Provide at least one --scope or --term query.');
  process.exit(1);
}

const normalizedScopes = scopeQueries.map((scope) => normalizeScopeEntry(scope));
const normalizedTerms = termQueries
  .map((term) => asNonEmptyString(term))
  .filter(Boolean)
  .map((term) => term.toLowerCase());

const entries = loadEntries().filter(
  (entry) => includeArchived || entry.data.status !== 'archived',
);

const scoreEntry = (entry) => {
  let score = 0;
  const reasons = [];
  const entryScopes = Array.isArray(entry.data.scope)
    ? entry.data.scope.map((scope) => normalizeScopeEntry(scope))
    : [];
  const searchableText = [
    entry.relativePath,
    entry.data.rule,
    entry.data.why,
    entry.body,
    ...(entry.data.scope ?? []),
    ...(entry.data['review-trigger'] ?? []),
    ...(Array.isArray(entry.data.evidence)
      ? entry.data.evidence.flatMap((evidence) => [evidence.type, evidence.ref, evidence.note])
      : []),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
  const ruleTokens = new Set(tokenizeRule(entry.data.rule ?? ''));

  normalizedScopes.forEach((query) => {
    entryScopes.forEach((entryScope) => {
      if (entryScope === query) {
        score += 12;
        reasons.push(`scope=${entryScope}`);
      } else if (entryScope.startsWith(`${query}/`) || query.startsWith(`${entryScope}/`)) {
        score += 8;
        reasons.push(`scope-overlap=${entryScope}`);
      }
    });
  });

  normalizedTerms.forEach((term) => {
    if (searchableText.includes(term)) {
      score += 3;
      reasons.push(`term=${term}`);
    } else if (ruleTokens.has(term)) {
      score += 2;
      reasons.push(`rule-token=${term}`);
    }
  });

  return {
    entry,
    score,
    reasons,
  };
};

const ranked = entries
  .map(scoreEntry)
  .filter((candidate) => candidate.score > 0)
  .sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.entry.relativePath.localeCompare(right.entry.relativePath);
  });

if (ranked.length === 0) {
  console.log('No matching project-memory entries found.');
  process.exit(0);
}

console.log(`Matched ${ranked.length} project-memory entr${ranked.length === 1 ? 'y' : 'ies'}:`);

ranked.slice(0, 20).forEach(({ entry, score, reasons }) => {
  const scope = Array.isArray(entry.data.scope) ? entry.data.scope.join(', ') : 'unknown scope';

  console.log('');
  console.log(
    `- ${entry.relativePath} [status=${entry.data.status}, score=${score}, reasons=${[
      ...new Set(reasons),
    ].join(', ')}]`,
  );
  console.log(`  scope: ${scope}`);
  console.log(`  rule: ${entry.data.rule}`);
  if (entry.body) {
    console.log(`  note: ${entry.body}`);
  }
});
