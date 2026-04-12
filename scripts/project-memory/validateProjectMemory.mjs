import fs from 'node:fs';
import path from 'node:path';

import {
  allowedArchiveReasons,
  allowedConfidence,
  allowedKinds,
  allowedStatuses,
  asNonEmptyString,
  calculateTokenJaccard,
  directoryToStatus,
  formatAgeInDays,
  isLocalRepoRef,
  isMeaninglessString,
  isValidIsoDate,
  loadEntries,
  normalizedScopeSignature,
  resolveRepoPath,
  stripLocalPathSuffix,
  tokenizeRule,
} from './projectMemoryUtils.mjs';

const entries = loadEntries();
const errors = [];
const warnings = [];
const entryByMemoryPath = new Map(entries.map((entry) => [entry.memoryRelativePath, entry]));
const codexConfigDirectory = path.join(process.cwd(), '.codex');
const codexConfigPath = path.join(codexConfigDirectory, 'config.toml');
const codexHooksPath = path.join(codexConfigDirectory, 'hooks.json');
const supportedHookEvents = new Set([
  'SessionStart',
  'PreToolUse',
  'PostToolUse',
  'UserPromptSubmit',
  'Stop',
]);
const requiredRepoHookEvents = ['SessionStart', 'UserPromptSubmit', 'PreToolUse', 'Stop'];

const pushError = (entry, message) => {
  errors.push(`${entry.relativePath}: ${message}`);
};

const countWords = (value) => value.trim().split(/\s+/u).filter(Boolean).length;

const requireMeaningfulString = (entry, value, fieldName) => {
  const normalized = asNonEmptyString(value);

  if (!normalized) {
    pushError(entry, `${fieldName} must be a non-empty string`);
    return undefined;
  }

  if (isMeaninglessString(normalized)) {
    pushError(entry, `${fieldName} contains a placeholder or meaningless value`);
    return undefined;
  }

  return normalized;
};

const requireStringList = (entry, value, fieldName) => {
  if (!Array.isArray(value) || value.length === 0) {
    pushError(entry, `${fieldName} must be a non-empty list`);
    return [];
  }

  return value.flatMap((item, index) => {
    const normalized = requireMeaningfulString(entry, item, `${fieldName}[${index}]`);

    return normalized ? [normalized] : [];
  });
};

const validateOptionalString = (entry, value, fieldName) => {
  if (value === undefined) {
    return undefined;
  }

  return requireMeaningfulString(entry, value, fieldName);
};

const validateOptionalStringList = (entry, value, fieldName) => {
  if (value === undefined) {
    return [];
  }

  return requireStringList(entry, value, fieldName);
};

const validatePromotionTarget = (entry, value) => {
  if (entry.data.status === 'archived') {
    if (value !== undefined) {
      const artifact = requireMeaningfulString(entry, value.artifact, 'promotion-target.artifact');
      const ref = requireMeaningfulString(entry, value.ref, 'promotion-target.ref');
      const trigger = requireMeaningfulString(entry, value.trigger, 'promotion-target.trigger');

      if (ref && isLocalRepoRef(ref) && !resolveRepoPath(ref)) {
        pushError(entry, `promotion-target.ref points to a missing local path: ${ref}`);
      }

      return {
        artifact,
        ref,
        trigger,
      };
    }

    return undefined;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    pushError(entry, 'promotion-target must be an object with artifact, ref, and trigger');
    return undefined;
  }

  const artifact = requireMeaningfulString(entry, value.artifact, 'promotion-target.artifact');
  const ref = requireMeaningfulString(entry, value.ref, 'promotion-target.ref');
  const trigger = requireMeaningfulString(entry, value.trigger, 'promotion-target.trigger');

  if (ref && isLocalRepoRef(ref) && !resolveRepoPath(ref)) {
    pushError(entry, `promotion-target.ref points to a missing local path: ${ref}`);
  }

  return {
    artifact,
    ref,
    trigger,
  };
};

const validateEvidence = (entry, value) => {
  if (!Array.isArray(value) || value.length === 0) {
    pushError(entry, 'evidence must be a non-empty list');
    return [];
  }

  return value.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      pushError(entry, `evidence[${index}] must be an object`);
      return [];
    }

    const type = requireMeaningfulString(entry, item.type, `evidence[${index}].type`);
    const ref = requireMeaningfulString(entry, item.ref, `evidence[${index}].ref`);
    const note = requireMeaningfulString(entry, item.note, `evidence[${index}].note`);

    if (ref && isLocalRepoRef(ref) && !resolveRepoPath(ref)) {
      pushError(
        entry,
        `evidence[${index}].ref points to a missing local path: ${stripLocalPathSuffix(ref)}`,
      );
    }

    return type && ref && note
      ? [
          {
            type,
            ref,
            note,
          },
        ]
      : [];
  });
};

entries.forEach((entry) => {
  const expectedStatus = directoryToStatus[entry.directory];

  if (!expectedStatus) {
    pushError(entry, `lives in unsupported directory "${entry.directory}"`);
  }

  const scope = requireStringList(entry, entry.data.scope, 'scope');
  const kind = requireMeaningfulString(entry, entry.data.kind, 'kind');
  const rule = requireMeaningfulString(entry, entry.data.rule, 'rule');
  const why = requireMeaningfulString(entry, entry.data.why, 'why');
  const mistake = validateOptionalString(entry, entry.data.mistake, 'mistake');
  const correction = validateOptionalString(entry, entry.data.correction, 'correction');
  const evidence = validateEvidence(entry, entry.data.evidence);
  const status = requireMeaningfulString(entry, entry.data.status, 'status');
  const confidence = requireMeaningfulString(entry, entry.data.confidence, 'confidence');
  const appliesWhen = validateOptionalStringList(entry, entry.data['applies-when'], 'applies-when');
  const reviewTriggers = requireStringList(entry, entry.data['review-trigger'], 'review-trigger');
  const lastVerifiedAt = requireMeaningfulString(
    entry,
    entry.data['last-verified-at'],
    'last-verified-at',
  );
  const promotionTarget = validatePromotionTarget(entry, entry.data['promotion-target']);

  if (status && !allowedStatuses.has(status)) {
    pushError(entry, `status must be one of ${[...allowedStatuses].join(', ')}`);
  }

  if (status && expectedStatus && status !== expectedStatus) {
    pushError(entry, `status "${status}" does not match directory "${entry.directory}"`);
  }

  if (kind && !allowedKinds.has(kind)) {
    pushError(entry, `kind must be one of ${[...allowedKinds].join(', ')}`);
  }

  if (confidence && !allowedConfidence.has(confidence)) {
    pushError(entry, `confidence must be one of ${[...allowedConfidence].join(', ')}`);
  }

  if (lastVerifiedAt && !isValidIsoDate(lastVerifiedAt)) {
    pushError(entry, 'last-verified-at must be a valid ISO date in YYYY-MM-DD format');
  }

  if (entry.data.status === 'archived') {
    const archiveReason = requireMeaningfulString(
      entry,
      entry.data['archive-reason'],
      'archive-reason',
    );

    if (archiveReason && !allowedArchiveReasons.has(archiveReason)) {
      pushError(entry, `archive-reason must be one of ${[...allowedArchiveReasons].join(', ')}`);
    }
  } else if (entry.data['archive-reason'] !== undefined) {
    pushError(entry, 'archive-reason is only allowed on archived records');
  }

  ['supersedes', 'superseded-by'].forEach((fieldName) => {
    const value = entry.data[fieldName];

    if (value === undefined) {
      return;
    }

    if (!Array.isArray(value) || value.length === 0) {
      pushError(entry, `${fieldName} must be a non-empty list when present`);
      return;
    }

    value.forEach((relatedPath, index) => {
      const normalized = requireMeaningfulString(entry, relatedPath, `${fieldName}[${index}]`);

      if (!normalized) {
        return;
      }

      if (normalized === entry.memoryRelativePath) {
        pushError(entry, `${fieldName}[${index}] cannot point to the same record`);
        return;
      }

      if (!entryByMemoryPath.has(normalized)) {
        pushError(entry, `${fieldName}[${index}] points to a missing record: ${normalized}`);
      }
    });
  });

  if (
    entry.data.status === 'archived' &&
    ['superseded', 'merged'].includes(entry.data['archive-reason']) &&
    (!Array.isArray(entry.data['superseded-by']) || entry.data['superseded-by'].length === 0)
  ) {
    pushError(entry, 'archived records with superseded/merged reasons must declare superseded-by');
  }

  if (scope.length > 0 && new Set(scope).size !== scope.length) {
    pushError(entry, 'scope must not contain duplicate entries');
  }

  if (reviewTriggers.length > 0 && new Set(reviewTriggers).size !== reviewTriggers.length) {
    pushError(entry, 'review-trigger must not contain duplicate items');
  }

  if (appliesWhen.length > 0 && new Set(appliesWhen).size !== appliesWhen.length) {
    pushError(entry, 'applies-when must not contain duplicate items');
  }

  if (evidence.length > 0) {
    const evidenceKeys = evidence.map((item) => `${item.type}|${item.ref}|${item.note}`);

    if (new Set(evidenceKeys).size !== evidenceKeys.length) {
      pushError(entry, 'evidence items must not be duplicated verbatim');
    }
  }

  if (
    entry.data.status === 'draft' &&
    lastVerifiedAt &&
    evidence.length <= 1 &&
    typeof formatAgeInDays(lastVerifiedAt) === 'number' &&
    formatAgeInDays(lastVerifiedAt) > 90
  ) {
    warnings.push(
      `${entry.relativePath}: stale draft candidate (older than 90 days without extra evidence)`,
    );
  }

  if (
    promotionTarget?.ref &&
    isLocalRepoRef(promotionTarget.ref) &&
    !resolveRepoPath(promotionTarget.ref)
  ) {
    pushError(entry, `promotion-target.ref points to a missing local path: ${promotionTarget.ref}`);
  }

  if (rule && why && rule === why) {
    pushError(entry, 'rule and why must not be identical');
  }

  if (entry.data.kind === 'correction' && (!mistake || !correction || appliesWhen.length === 0)) {
    pushError(
      entry,
      'correction entries must declare mistake, correction, and applies-when so future retrieval can surface both the original wrong conclusion and the fix.',
    );
  }

  if (entry.data.status === 'promoted') {
    const bodyWordCount = entry.body ? countWords(entry.body) : 0;

    if (bodyWordCount > 80) {
      pushError(
        entry,
        `promoted body is too long for a structured breadcrumb (${bodyWordCount} words); keep promoted notes short and point to the stronger artifact`,
      );
    } else if (bodyWordCount > 45) {
      warnings.push(
        `${entry.relativePath}: promoted body is getting long for a structured breadcrumb (${bodyWordCount} words)`,
      );
    }

    if (entry.body && rule) {
      const bodySimilarity = calculateTokenJaccard(tokenizeRule(entry.body), tokenizeRule(rule));

      if (bodyWordCount > 24 && bodySimilarity >= 0.68) {
        warnings.push(
          `${entry.relativePath}: promoted body closely restates the rule; prefer a shorter breadcrumb that points at the stronger artifact`,
        );
      }
    }

    if (promotionTarget?.ref && isLocalRepoRef(promotionTarget.ref)) {
      const targetPath = resolveRepoPath(promotionTarget.ref);

      if (targetPath) {
        const targetContent = fs.readFileSync(targetPath, 'utf8').toLowerCase();
        const distinctiveTokens = tokenizeRule(rule ?? '').filter((token) => token.length >= 5);
        const overlapCount = distinctiveTokens.filter((token) =>
          targetContent.includes(token),
        ).length;

        if (distinctiveTokens.length > 0 && overlapCount === 0) {
          warnings.push(
            `${entry.relativePath}: promotion-target.ref may not be discoverable from the stronger artifact; no distinctive rule tokens were found in ${promotionTarget.ref}`,
          );
        }
      }
    }
  }
});

entries.forEach((entry) => {
  const supersedes = Array.isArray(entry.data.supersedes) ? entry.data.supersedes : [];
  const supersededBy = Array.isArray(entry.data['superseded-by'])
    ? entry.data['superseded-by']
    : [];

  supersedes.forEach((targetPath) => {
    const target = entryByMemoryPath.get(targetPath);

    if (!target) {
      return;
    }

    const reciprocal = Array.isArray(target.data['superseded-by'])
      ? target.data['superseded-by']
      : [];

    if (!reciprocal.includes(entry.memoryRelativePath)) {
      pushError(
        entry,
        `supersedes=${targetPath} must be reciprocated by ${target.relativePath} via superseded-by`,
      );
    }
  });

  supersededBy.forEach((targetPath) => {
    const target = entryByMemoryPath.get(targetPath);

    if (!target) {
      return;
    }

    const reciprocal = Array.isArray(target.data.supersedes) ? target.data.supersedes : [];

    if (!reciprocal.includes(entry.memoryRelativePath)) {
      pushError(
        entry,
        `superseded-by=${targetPath} must be reciprocated by ${target.relativePath} via supersedes`,
      );
    }
  });
});

const liveEntries = entries.filter((entry) => entry.data.status !== 'archived');

for (let leftIndex = 0; leftIndex < liveEntries.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < liveEntries.length; rightIndex += 1) {
    const left = liveEntries[leftIndex];
    const right = liveEntries[rightIndex];

    if (
      normalizedScopeSignature(Array.isArray(left.data.scope) ? left.data.scope : []) !==
      normalizedScopeSignature(Array.isArray(right.data.scope) ? right.data.scope : [])
    ) {
      continue;
    }

    const leftRule = asNonEmptyString(left.data.rule);
    const rightRule = asNonEmptyString(right.data.rule);

    if (!leftRule || !rightRule) {
      continue;
    }

    const normalizedLeftRule = leftRule.toLowerCase();
    const normalizedRightRule = rightRule.toLowerCase();
    const similarity = calculateTokenJaccard(tokenizeRule(leftRule), tokenizeRule(rightRule));

    if (
      normalizedLeftRule === normalizedRightRule ||
      normalizedLeftRule.includes(normalizedRightRule) ||
      normalizedRightRule.includes(normalizedLeftRule) ||
      similarity >= 0.82
    ) {
      errors.push(
        `Possible duplicate rule in same scope: ${left.relativePath} <-> ${right.relativePath} (similarity=${similarity.toFixed(2)})`,
      );
    }
  }
}

if (!fs.existsSync(codexConfigDirectory)) {
  errors.push('.codex/: missing repo-local Codex configuration directory');
} else if (!fs.statSync(codexConfigDirectory).isDirectory()) {
  errors.push('.codex/: expected a directory so project-scoped Codex config and hooks can load');
}

if (!fs.existsSync(codexConfigPath)) {
  errors.push('.codex/config.toml: missing project-scoped Codex config');
} else {
  const configContent = fs.readFileSync(codexConfigPath, 'utf8');

  if (!/^\s*\[features\]\s*$/mu.test(configContent)) {
    errors.push('.codex/config.toml: missing [features] table required for codex_hooks');
  }

  if (!/^\s*codex_hooks\s*=\s*true\s*$/mu.test(configContent)) {
    errors.push('.codex/config.toml: codex_hooks must be enabled for repo-local hook automation');
  }
}

if (!fs.existsSync(codexHooksPath)) {
  errors.push('.codex/hooks.json: missing repo-local Codex hook config');
} else {
  try {
    const rawHooksConfig = JSON.parse(fs.readFileSync(codexHooksPath, 'utf8'));
    const hooks = rawHooksConfig?.hooks;

    if (!hooks || typeof hooks !== 'object' || Array.isArray(hooks)) {
      errors.push('.codex/hooks.json: top-level hooks object is required');
    } else {
      Object.entries(hooks).forEach(([eventName, matcherGroups]) => {
        if (!supportedHookEvents.has(eventName)) {
          errors.push(
            `.codex/hooks.json: unsupported hook event "${eventName}" (supported: ${[
              ...supportedHookEvents,
            ].join(', ')})`,
          );
          return;
        }

        if (!Array.isArray(matcherGroups) || matcherGroups.length === 0) {
          errors.push(
            `.codex/hooks.json: ${eventName} must be a non-empty array of matcher groups`,
          );
          return;
        }

        matcherGroups.forEach((matcherGroup, matcherGroupIndex) => {
          if (!matcherGroup || typeof matcherGroup !== 'object' || Array.isArray(matcherGroup)) {
            errors.push(
              `.codex/hooks.json: ${eventName}[${matcherGroupIndex}] must be an object with hooks[]`,
            );
            return;
          }

          if (!Array.isArray(matcherGroup.hooks) || matcherGroup.hooks.length === 0) {
            errors.push(
              `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks must be a non-empty array`,
            );
            return;
          }

          if (
            ['UserPromptSubmit', 'Stop'].includes(eventName) &&
            matcherGroup.matcher !== undefined
          ) {
            warnings.push(
              `.codex/hooks.json: ${eventName}[${matcherGroupIndex}] declares matcher even though current Codex ignores matcher for that event`,
            );
          }

          matcherGroup.hooks.forEach((hook, hookIndex) => {
            if (!hook || typeof hook !== 'object' || Array.isArray(hook)) {
              errors.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] must be an object`,
              );
              return;
            }

            if (hook.type !== 'command') {
              errors.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] must use type="command"`,
              );
            }

            if (typeof hook.command !== 'string' || hook.command.trim() === '') {
              errors.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].command must be a non-empty string`,
              );
            } else if (!hook.command.includes('scripts/project-memory/codexHooks.mjs')) {
              warnings.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}] does not point at scripts/project-memory/codexHooks.mjs`,
              );
            }

            if (
              hook.statusMessage !== undefined &&
              (typeof hook.statusMessage !== 'string' || hook.statusMessage.trim() === '')
            ) {
              errors.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].statusMessage must be a non-empty string when present`,
              );
            }

            if (
              hook.timeout !== undefined &&
              (typeof hook.timeout !== 'number' ||
                !Number.isFinite(hook.timeout) ||
                hook.timeout <= 0)
            ) {
              errors.push(
                `.codex/hooks.json: ${eventName}[${matcherGroupIndex}].hooks[${hookIndex}].timeout must be a positive number when present`,
              );
            }
          });
        });
      });

      requiredRepoHookEvents.forEach((eventName) => {
        if (!Array.isArray(hooks[eventName]) || hooks[eventName].length === 0) {
          errors.push(`.codex/hooks.json: ${eventName} hook wiring is required in this repo`);
        }
      });
    }
  } catch (error) {
    errors.push(
      `.codex/hooks.json: failed to parse JSON (${error instanceof Error ? error.message : String(error)})`,
    );
  }
}

if (errors.length > 0) {
  console.error('Project memory validation failed:\n');
  errors.forEach((message) => {
    console.error(`- ${message}`);
  });

  if (warnings.length > 0) {
    console.error('\nWarnings:');
    warnings.forEach((message) => {
      console.error(`- ${message}`);
    });
  }

  process.exit(1);
}

console.log(
  `Project memory validation passed for ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`,
);

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach((message) => {
    console.log(`- ${message}`);
  });
}
