import fs from 'node:fs';
import path from 'node:path';

import {
  classifyRiskyCategories,
  loadEntries,
  normalizeRepoRelativePath,
  readActiveTaskState,
  resolveRepoPath,
  scopeContainsPath,
  tokenizeRule,
} from './projectMemoryUtils.mjs';
import { lookupProjectMemory } from './lookupProjectMemory.mjs';
import { analyzeProjectMemoryDiff } from './reviewProjectMemoryDiff.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';

const usage = `Usage:
  node ./scripts/project-memory/codexHooks.mjs <session-start|user-prompt-submit|pre-tool-use|stop>`;

// Verified against the installed Codex runtime contract: additive hooks may safely
// soft-fallback, while the narrow Bash guard hook must surface internal failures as
// non-zero exits so Codex does not silently treat broken guardrails as success.
const hookFailurePolicies = {
  'session-start': {
    eventName: 'SessionStart',
    failureMode: 'soft fallback',
    exitCode: 0,
    resolutionLine: 'Continuing without hook output because this hook only adds context.',
  },
  'user-prompt-submit': {
    eventName: 'UserPromptSubmit',
    failureMode: 'soft fallback',
    exitCode: 0,
    resolutionLine: 'Continuing without hook output because this hook only adds context.',
  },
  'pre-tool-use': {
    eventName: 'PreToolUse',
    failureMode: 'hard failure',
    exitCode: 1,
    resolutionLine:
      'Refusing to report success because this hook participates in Bash guardrail enforcement.',
  },
  stop: {
    eventName: 'Stop',
    failureMode: 'soft fallback',
    exitCode: 0,
    resolutionLine:
      'Continuing without hook output because stop-time guidance should not become a late-stage trap.',
  },
};

const promptStopWords = new Set([
  'about',
  'after',
  'agent',
  'automation',
  'before',
  'build',
  'change',
  'changes',
  'check',
  'codex',
  'config',
  'current',
  'diff',
  'docs',
  'documentation',
  'finish',
  'hooks',
  'layer',
  'memory',
  'official',
  'project',
  'prompt',
  'repo',
  'repository',
  'review',
  'scope',
  'service',
  'shared',
  'start',
  'stop',
  'task',
  'tasks',
  'update',
  'validate',
  'validator',
  'behavior',
  'investigate',
  'workflow',
]);

const readJsonFromStdin = async () => {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();

  if (raw === '') {
    return {};
  }

  return JSON.parse(raw);
};

const getTaskStatePath = () => {
  const override = process.env.PROJECT_MEMORY_TASK_STATE;

  if (!override) {
    return defaultTaskStatePath;
  }

  return path.isAbsolute(override) ? override : path.join(process.cwd(), override);
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const compactScopes = (scopes) => {
  const normalizedScopes = unique(scopes.map(normalizeRepoRelativePath));

  return normalizedScopes.filter(
    (scope) =>
      !normalizedScopes.some(
        (otherScope) =>
          otherScope !== scope &&
          normalizeRepoRelativePath(scope).startsWith(`${normalizeRepoRelativePath(otherScope)}/`),
      ),
  );
};

const pathPattern =
  /(?:^|[\s`"'(])((?:\.project-memory|\.codex|scripts|src)\/[A-Za-z0-9._/-]+|AGENTS\.md|package\.json|pnpm-lock\.yaml)(?=$|[\s`"'):,.;])/gmu;

const extractPaths = (value) => {
  const matches = [];

  for (const match of value.matchAll(pathPattern)) {
    const candidate = normalizeRepoRelativePath(match[1] ?? '');

    if (candidate !== '') {
      matches.push(candidate);
    }
  }

  return unique(matches).flatMap((candidate) => {
    const absolutePath = resolveRepoPath(candidate);

    if (!absolutePath) {
      return [candidate];
    }

    const stat = fs.statSync(absolutePath);
    const parentDirectory = path.posix.dirname(candidate);

    return stat.isDirectory()
      ? [candidate]
      : [
          candidate,
          ...(parentDirectory === '.' ? [] : [normalizeRepoRelativePath(parentDirectory)]),
        ];
  });
};

const extractTerms = (prompt) =>
  tokenizeRule(prompt)
    .filter((token) => token.length >= 4 && !promptStopWords.has(token))
    .slice(0, 8);

const summarizeEntries = (rankedEntries, limit = 4) =>
  rankedEntries.slice(0, limit).map(({ entry, reasons }) => {
    const summary = [entry.relativePath, entry.data.rule].filter(Boolean).join(': ');
    const reasonText = [...new Set(reasons)].slice(0, 3).join(', ');

    return reasonText ? `- ${summary} [${reasonText}]` : `- ${summary}`;
  });

const renderSuggestedTaskStart = (scopes, terms) => {
  if (scopes.length === 0) {
    return undefined;
  }

  const exactScopes = compactScopes(scopes).slice(0, 3);
  const taskTerms = terms.slice(0, 3);

  return [
    'pnpm memory:task:start',
    ...exactScopes.flatMap((scope) => ['--scope', scope]),
    ...taskTerms.flatMap((term) => ['--term', term]),
  ].join(' ');
};

const buildPromptDiscoveryContext = ({ prompt, state }) => {
  const promptScopes = extractPaths(prompt);
  const promptTerms = extractTerms(prompt);
  const riskyPromptScopes = promptScopes.filter(
    (scope) => classifyRiskyCategories(scope).length > 0,
  );
  const baseScopes = riskyPromptScopes.length > 0 ? riskyPromptScopes : (state?.exactScopes ?? []);
  const fallbackTerms = promptTerms.length > 0 ? promptTerms : (state?.taskTerms ?? []);
  const lookup = lookupProjectMemory({
    scopeQueries: baseScopes,
    termQueries: fallbackTerms,
  });
  const scopeAnchoredEntries =
    baseScopes.length > 0
      ? lookup.rankedEntries.filter(({ entry }) => {
          const entryScopes = Array.isArray(entry.data.scope)
            ? entry.data.scope.map(normalizeRepoRelativePath)
            : [];

          return entryScopes.some((entryScope) =>
            lookup.lookupScopes.some((scope) => scopeContainsPath(scope, entryScope)),
          );
        })
      : [];
  const rankedEntries =
    scopeAnchoredEntries.length > 0 ? scopeAnchoredEntries : lookup.rankedEntries;
  const shouldNudgeTaskStart =
    baseScopes.length > 0 &&
    baseScopes.some((scope) => classifyRiskyCategories(scope).length > 0) &&
    state === undefined;

  if (rankedEntries.length === 0 && !shouldNudgeTaskStart) {
    return undefined;
  }

  const lines = ['Project-memory auto-context:'];

  if (baseScopes.length > 0) {
    lines.push(`- inferred risky scopes: ${baseScopes.join(', ')}`);
  }

  if (lookup.boundaryScopeQueries.length > 0) {
    lines.push(`- boundary scopes: ${lookup.boundaryScopeQueries.join(', ')}`);
  }

  if (fallbackTerms.length > 0) {
    lines.push(`- task terms: ${fallbackTerms.join(', ')}`);
  }

  if (rankedEntries.length > 0) {
    lines.push('- matching memory to read before behavior changes:');
    lines.push(...summarizeEntries(rankedEntries));
  } else {
    lines.push('- no matching project-memory entries found yet for the inferred risky scope.');
  }

  if (shouldNudgeTaskStart) {
    const suggestedCommand = renderSuggestedTaskStart(baseScopes, fallbackTerms);

    if (suggestedCommand) {
      lines.push(`- before non-trivial edits, run: ${suggestedCommand}`);
    }
  }

  lines.push(
    '- hooks preload context and point to the next lifecycle step early, but only pnpm memory:task:start and pnpm memory:task:finish record discovery and learning decisions.',
  );

  return lines.join('\n');
};

const buildSessionContext = (state) => {
  const lines = [
    'This repo wires Codex hooks into .project-memory.',
    'For risky scopes such as .project-memory, scripts/project-memory, src/shared, service boundaries, helper semantics, filesystem/VFS, CRDT, and schema or migration paths, start with pnpm memory:task:start before non-trivial edits.',
    'Hooks are intentionally front-loaded: they preload memory and nudge discovery before risky edits, while pnpm memory:task:finish is the explicit place to record lifecycle and learning decisions. PreToolUse only guards Bash and is not a complete enforcement boundary.',
  ];

  if (!state) {
    return lines.join('\n');
  }

  const matchedEntryLines = loadEntries()
    .filter(
      (entry) =>
        Array.isArray(state.matchedEntries) &&
        state.matchedEntries.includes(entry.memoryRelativePath),
    )
    .slice(0, 4)
    .map((entry) => `- ${entry.relativePath}: ${entry.data.rule}`);

  lines.push(
    `Active task state: scopes=${Array.isArray(state.lookupScopes) ? state.lookupScopes.join(', ') : 'none'}; terms=${Array.isArray(state.taskTerms) && state.taskTerms.length > 0 ? state.taskTerms.join(', ') : 'none'}.`,
  );

  if (matchedEntryLines.length > 0) {
    lines.push('Previously matched memory:');
    lines.push(...matchedEntryLines);
  }

  return lines.join('\n');
};

const isWriteLikeCommand = (command) =>
  /\b(git\s+(apply|commit|push)|mv|cp|rm|install|touch|mkdir|tee|truncate)\b/u.test(command) ||
  /\bsed\s+-i\b/u.test(command) ||
  /\bperl\s+-i\b/u.test(command) ||
  />{1,2}/u.test(command);

const buildPreToolBlockReason = (command, state) => {
  if (/\bpnpm\s+memory:task:start\b/u.test(command)) {
    return undefined;
  }

  if (state) {
    return undefined;
  }

  if (!isWriteLikeCommand(command)) {
    return undefined;
  }

  const riskyPaths = extractPaths(command).filter(
    (filePath) => classifyRiskyCategories(filePath).length > 0,
  );
  const compactRiskyPaths = compactScopes(riskyPaths);

  if (compactRiskyPaths.length === 0) {
    return undefined;
  }

  const suggestedCommand = renderSuggestedTaskStart(compactRiskyPaths, []);

  return [
    `Risky Bash write detected before project-memory discovery: ${compactRiskyPaths.join(', ')}`,
    suggestedCommand
      ? `Run ${suggestedCommand} first, then retry the command.`
      : 'Run pnpm memory:task:start first, then retry the command.',
    'This Bash guard is intentionally narrow; finish the task later with pnpm memory:task:finish so the learning decision is recorded in one explicit place.',
  ].join('\n');
};

const renderStopWarning = (review) =>
  [
    'Project-memory follow-up before you leave this task:',
    ...[...review.failures, ...review.warnings].slice(0, 5).map((warning) => `- ${warning}`),
    'Preferred path: run `pnpm memory:task:finish` so the lifecycle review and any learning capture decision are recorded explicitly.',
  ].join('\n');

const getHookFailurePolicy = (command) =>
  hookFailurePolicies[command] ?? {
    eventName: command,
    failureMode: 'hard failure',
    exitCode: 1,
    resolutionLine: 'Refusing to report success for an unknown hook command failure.',
  };

const exitForHookFailure = (command, error) => {
  const policy = getHookFailurePolicy(command);
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(
    `[project-memory hook:${command}] ${policy.eventName} ${policy.failureMode}: ${errorMessage}`,
  );
  console.error(policy.resolutionLine);

  if (policy.exitCode !== 0) {
    console.error(usage);
  }

  process.exit(policy.exitCode);
};

const run = async () => {
  const command = process.argv[2];

  if (!command) {
    throw new Error('Missing hook command.');
  }

  const payload = await readJsonFromStdin();
  const state = readActiveTaskState(getTaskStatePath());

  if (command === 'session-start') {
    const additionalContext = buildSessionContext(state);

    console.log(
      JSON.stringify(
        {
          hookSpecificOutput: {
            hookEventName: 'SessionStart',
            additionalContext,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'user-prompt-submit') {
    const prompt = typeof payload.prompt === 'string' ? payload.prompt : '';
    const additionalContext = buildPromptDiscoveryContext({
      prompt,
      state,
    });

    if (!additionalContext) {
      return;
    }

    console.log(
      JSON.stringify(
        {
          hookSpecificOutput: {
            hookEventName: 'UserPromptSubmit',
            additionalContext,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'pre-tool-use') {
    const toolCommand =
      typeof payload?.tool_input?.command === 'string' ? payload.tool_input.command : '';
    const reason = buildPreToolBlockReason(toolCommand, state);

    if (!reason) {
      return;
    }

    console.log(
      JSON.stringify(
        {
          decision: 'block',
          reason,
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason,
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  if (command === 'stop') {
    if (!state) {
      return;
    }

    const review = analyzeProjectMemoryDiff({
      stateFilePath: getTaskStatePath(),
    });

    if (review.failures.length > 0 || review.warnings.length > 0) {
      console.log(
        JSON.stringify(
          {
            systemMessage: renderStopWarning(review),
          },
          null,
          2,
        ),
      );
    }

    return;
  }

  throw new Error(`Unknown hook command: ${command}`);
};

run().catch((error) => {
  exitForHookFailure(process.argv[2] ?? 'unknown', error);
});
