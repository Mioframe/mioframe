import fs from 'node:fs';
import path from 'node:path';

import {
  classifyRiskyCategories,
  isRiskyPath,
  loadEntries,
  normalizeRepoRelativePath,
  resolveRepoPath,
  scopeContainsPath,
  tokenizeRule,
} from './projectMemoryUtils.mjs';
import { lookupProjectMemory } from './lookupProjectMemory.mjs';
import {
  analyzeProjectMemoryDiff,
  renderProjectMemoryDiffReview,
} from './reviewProjectMemoryDiff.mjs';
import { defaultTaskStatePath } from './startProjectMemoryTask.mjs';

const usage = `Usage:
  node ./scripts/project-memory/codexHooks.mjs <session-start|user-prompt-submit|pre-tool-use|stop>`;

const softFailureCommands = new Set(['session-start', 'user-prompt-submit']);

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

const readTaskState = () => {
  const statePath = getTaskStatePath();

  if (!fs.existsSync(statePath)) {
    return undefined;
  }

  return JSON.parse(fs.readFileSync(statePath, 'utf8'));
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

const getBoundaryScopes = (scopes) => {
  if (scopes.length === 0) {
    return [];
  }

  const boundaryScopes = loadEntries()
    .filter((entry) => entry.data.status !== 'archived')
    .flatMap((entry) => {
      const entryScopes = Array.isArray(entry.data.scope)
        ? entry.data.scope.map(normalizeRepoRelativePath)
        : [];

      if (
        !entryScopes.some((entryScope) =>
          scopes.some((scope) => scopeContainsPath(scope, entryScope)),
        )
      ) {
        return [];
      }

      return entryScopes.filter(
        (entryScope) =>
          !scopes.some((scope) => scopeContainsPath(scope, entryScope)) && isRiskyPath(entryScope),
      );
    });

  return unique(boundaryScopes);
};

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
  const riskyPromptScopes = promptScopes.filter(isRiskyPath);
  const baseScopes = riskyPromptScopes.length > 0 ? riskyPromptScopes : (state?.exactScopes ?? []);
  const fallbackTerms = promptTerms.length > 0 ? promptTerms : (state?.taskTerms ?? []);
  const boundaryScopes = getBoundaryScopes(baseScopes);
  const lookup = lookupProjectMemory({
    scopeQueries: [...baseScopes, ...boundaryScopes],
    termQueries: fallbackTerms,
  });
  const scopeAnchoredEntries =
    baseScopes.length > 0
      ? lookup.rankedEntries.filter(({ entry }) => {
          const entryScopes = Array.isArray(entry.data.scope)
            ? entry.data.scope.map(normalizeRepoRelativePath)
            : [];

          return entryScopes.some((entryScope) =>
            [...baseScopes, ...boundaryScopes].some((scope) =>
              scopeContainsPath(scope, entryScope),
            ),
          );
        })
      : [];
  const rankedEntries =
    scopeAnchoredEntries.length > 0 ? scopeAnchoredEntries : lookup.rankedEntries;
  const shouldNudgeTaskStart =
    baseScopes.length > 0 && baseScopes.some((scope) => isRiskyPath(scope)) && state === undefined;

  if (rankedEntries.length === 0 && !shouldNudgeTaskStart) {
    return undefined;
  }

  const lines = ['Project-memory auto-context:'];

  if (baseScopes.length > 0) {
    lines.push(`- inferred risky scopes: ${baseScopes.join(', ')}`);
  }

  if (boundaryScopes.length > 0) {
    lines.push(`- boundary scopes: ${boundaryScopes.join(', ')}`);
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
    '- hooks can preload context and the Stop hook can request one extra pass for unresolved lifecycle work, but only pnpm memory:task:start records discovery for finish/CI.',
  );

  return lines.join('\n');
};

const buildSessionContext = (state) => {
  const lines = [
    'This repo wires Codex hooks into .project-memory.',
    'For risky scopes such as .project-memory, scripts/project-memory, src/shared, service boundaries, helper semantics, filesystem/VFS, CRDT, and schema or migration paths, start with pnpm memory:task:start before non-trivial edits.',
    'The Stop hook can request one extra pass when risky diff lifecycle handling is missing; if the follow-up still fails, it stops without silently succeeding. PreToolUse only guards Bash and is not a complete enforcement boundary.',
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

  if (/\bgit\s+(commit|push)\b/u.test(command)) {
    const review = analyzeProjectMemoryDiff({
      requireTaskStart: true,
      stateFilePath: getTaskStatePath(),
    });

    if (review.failures.length > 0) {
      return [
        'Project-memory lifecycle is still unresolved for the current diff.',
        ...review.failures.slice(0, 3).map((failure) => `- ${failure}`),
        'Run pnpm memory:task:finish or update/archive/keep the related entry before commit/push.',
      ].join('\n');
    }

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
    'This Bash guard is intentionally narrow; non-shell tool calls are reviewed again by Stop, pre-commit, and CI.',
  ].join('\n');
};

const renderStopReason = (review) =>
  [
    'Project-memory lifecycle is still open for this diff.',
    ...review.failures.slice(0, 4).map((failure) => `- ${failure}`),
    'Handle the related memory entry (refresh, promote, archive, or explicit keep) and rerun pnpm memory:task:finish before stopping.',
  ].join('\n');

const renderStopContinuationPrompt = (review) =>
  [
    'Project-memory lifecycle is still unresolved for the current diff.',
    ...review.failures.slice(0, 4).map((failure) => `- ${failure}`),
    'Handle the related memory entry (refresh, promote, archive, or explicit keep), rerun `pnpm memory:task:finish`, and only stop once the lifecycle review is clean.',
    '',
    'Diff review details:',
    renderProjectMemoryDiffReview(review),
  ].join('\n');

const renderStopWarning = (review) =>
  [
    'Project-memory warnings for the current diff:',
    ...review.warnings.slice(0, 4).map((warning) => `- ${warning}`),
  ].join('\n');

const exitForHookFailure = (command, error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const failureMode = softFailureCommands.has(command) ? 'soft fallback' : 'hard failure';
  const resolutionLine = softFailureCommands.has(command)
    ? 'Continuing without hook output because this hook only adds context.'
    : 'Refusing to report success because this hook participates in enforcement.';

  console.error(`[project-memory hook:${command}] ${failureMode}: ${errorMessage}`);
  console.error(resolutionLine);

  if (!softFailureCommands.has(command)) {
    console.error(usage);
  }

  process.exit(softFailureCommands.has(command) ? 0 : 1);
};

const run = async () => {
  const command = process.argv[2];

  if (!command) {
    throw new Error('Missing hook command.');
  }

  const payload = await readJsonFromStdin();
  const state = readTaskState();

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
    const review = analyzeProjectMemoryDiff({
      requireTaskStart: true,
      stateFilePath: getTaskStatePath(),
    });

    if (review.failures.length > 0) {
      if (payload.stop_hook_active) {
        console.log(
          JSON.stringify(
            {
              continue: false,
              stopReason:
                'Project-memory lifecycle remained unresolved after the Stop continuation pass.',
              systemMessage: `${renderStopReason(review)}\n\n${renderProjectMemoryDiffReview(review)}`,
            },
            null,
            2,
          ),
        );
        return;
      }

      console.log(
        JSON.stringify(
          {
            decision: 'block',
            reason: renderStopContinuationPrompt(review),
            systemMessage: renderStopReason(review),
          },
          null,
          2,
        ),
      );
      return;
    }

    if (review.warnings.length > 0) {
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
