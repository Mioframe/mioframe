import fs from 'node:fs';
import path from 'node:path';

export const usageStatsVersion = 1;
export const defaultAutoContextEntryLimit = 4;
export const defaultAutoContextLineBudget = 28;
export const defaultExpandedEntryLimit = 8;

const normalizeWhitespace = (value) => value.trim().replace(/\s+/g, ' ');
const asList = (value) => (Array.isArray(value) ? value : []);
const unique = (values) => [...new Set(values.filter(Boolean))];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const createEmptyUsageStats = () => ({
  version: usageStatsVersion,
  entries: {},
  signatures: {},
});

export const readUsageStats = (usageStatsPath) => {
  if (!fs.existsSync(usageStatsPath)) {
    return createEmptyUsageStats();
  }

  const parsed = JSON.parse(fs.readFileSync(usageStatsPath, 'utf8'));

  return {
    version: usageStatsVersion,
    entries:
      parsed && typeof parsed.entries === 'object' && !Array.isArray(parsed.entries)
        ? parsed.entries
        : {},
    signatures:
      parsed && typeof parsed.signatures === 'object' && !Array.isArray(parsed.signatures)
        ? parsed.signatures
        : {},
  };
};

export const writeUsageStats = (usageStatsPath, usageStats) => {
  fs.mkdirSync(path.dirname(usageStatsPath), { recursive: true });
  fs.writeFileSync(usageStatsPath, `${JSON.stringify(usageStats, null, 2)}\n`, 'utf8');
};

const stableLower = (value) => normalizeWhitespace(`${value ?? ''}`).toLowerCase();

export const deriveRepeatSignature = (entry) => {
  const explicit = stableLower(entry.data['repeat-signature']);

  if (explicit !== '') {
    return explicit;
  }

  return [
    stableLower(entry.data.kind),
    stableLower(entry.data.rule),
    stableLower(entry.data.mistake),
    ...asList(entry.data.scope)
      .map(stableLower)
      .sort((left, right) => left.localeCompare(right)),
  ]
    .filter(Boolean)
    .join('|');
};

const getEntryStats = (usageStats, entry) => usageStats.entries[entry.memoryRelativePath] ?? {};
const getSignatureStats = (usageStats, entry) =>
  usageStats.signatures[deriveRepeatSignature(entry)] ?? {};

export const getEntryUtilitySignal = (usageStats, entry) => {
  const entryStats = getEntryStats(usageStats, entry);
  const signatureStats = getSignatureStats(usageStats, entry);
  const useCount = Number(entryStats.useCount ?? 0);
  const repeatCount = Number(
    Math.max(entryStats.repeatCount ?? 0, signatureStats.repeatCount ?? 0),
  );
  const preventedRepeatCount = Number(entryStats.preventedRepeatCount ?? 0);
  const falsePositiveCount = Number(entryStats.falsePositiveCount ?? 0);
  const promotionPriority = Number(
    Math.max(entryStats.promotionPriority ?? 0, signatureStats.promotionPriority ?? 0),
  );

  return {
    useCount,
    repeatCount,
    preventedRepeatCount,
    falsePositiveCount,
    promotionPriority,
    utilityScore:
      useCount * 3 +
      preventedRepeatCount * 4 +
      repeatCount * 2 +
      promotionPriority * 2 -
      falsePositiveCount * 3,
  };
};

const pickFirst = (values) => values.find((value) => stableLower(value) !== '');

export const createEntryDigest = (entry, { expanded = false } = {}) => {
  const trigger = pickFirst([
    ...asList(entry.data.triggers).flatMap((signal) =>
      typeof signal === 'string' ? [signal] : [signal.value, signal.when, signal.match],
    ),
    ...asList(entry.data['applies-when']),
    ...asList(entry.data['review-trigger']),
  ]);
  const avoid = pickFirst([entry.data.avoid, entry.data.mistake]);
  const useInstead = pickFirst([entry.data['use-instead'], entry.data.correction]);
  const strongerRef = entry.data['promotion-target']?.ref;
  const ref = strongerRef ? `${entry.relativePath} -> ${strongerRef}` : entry.relativePath;
  const lines = [
    `- rule: ${entry.data.rule}`,
    ...(avoid ? [`  avoid: ${avoid}`] : []),
    ...(useInstead ? [`  use instead: ${useInstead}`] : []),
    ...(trigger ? [`  trigger: ${trigger}`] : []),
    `  ref: ${ref}`,
  ];

  if (expanded) {
    return [
      ...lines,
      ...(entry.data.why ? [`  why: ${entry.data.why}`] : []),
      ...(entry.body ? [`  note: ${entry.body}`] : []),
    ];
  }

  return lines;
};

export const renderMemoryDigest = (
  rankedEntries,
  {
    expanded = false,
    limit = expanded ? defaultExpandedEntryLimit : defaultAutoContextEntryLimit,
    lineBudget = defaultAutoContextLineBudget,
    suppressEntryPaths = [],
  } = {},
) => {
  const suppressed = new Set(suppressEntryPaths);
  const lines = [];
  const renderedEntryPaths = [];

  rankedEntries.slice(0, limit * 2).forEach(({ entry }) => {
    if (renderedEntryPaths.length >= limit || suppressed.has(entry.memoryRelativePath)) {
      return;
    }

    const digestLines = createEntryDigest(entry, { expanded });

    if (
      !expanded &&
      lines.length + digestLines.length > lineBudget &&
      renderedEntryPaths.length > 0
    ) {
      return;
    }

    lines.push(...digestLines);
    renderedEntryPaths.push(entry.memoryRelativePath);
  });

  return {
    lines,
    renderedEntryPaths,
    totalCandidates: rankedEntries.length,
    suppressedCount: rankedEntries.filter(({ entry }) => suppressed.has(entry.memoryRelativePath))
      .length,
  };
};

const normalizeSignal = (signal, fallbackType) => {
  if (typeof signal === 'string') {
    return {
      type: fallbackType,
      value: signal,
    };
  }

  if (!signal || typeof signal !== 'object' || Array.isArray(signal)) {
    return undefined;
  }

  return {
    type: stableLower(signal.type || fallbackType),
    value: signal.value ?? signal.match ?? signal.when ?? '',
    withTerms: asList(signal['with-terms'] ?? signal.withTerms).map(stableLower),
  };
};

const signalMatches = (signal, { changedPaths, diffText, terms, scopes }) => {
  const value = stableLower(signal.value);

  if (value === '') {
    return false;
  }

  if (signal.withTerms.length > 0 && !signal.withTerms.some((term) => terms.has(term))) {
    return false;
  }

  if (signal.type === 'path') {
    return changedPaths.some((filePath) => stableLower(filePath).includes(value));
  }

  if (signal.type === 'function' || signal.type === 'helper') {
    return diffText.includes(value);
  }

  if (signal.type === 'diff') {
    return diffText.includes(value);
  }

  if (signal.type === 'scope-term') {
    return scopes.some((scope) => stableLower(scope).includes(value)) || terms.has(value);
  }

  return (
    changedPaths.some((filePath) => stableLower(filePath).includes(value)) ||
    diffText.includes(value) ||
    terms.has(value)
  );
};

export const detectEntryTriggerMatches = (
  entries,
  { changedPaths = [], diffText = '', terms = [], scopes = [] } = {},
) => {
  const normalizedDiffText = stableLower(diffText);
  const normalizedTerms = new Set(terms.map(stableLower).filter(Boolean));
  const normalizedScopes = scopes.map(stableLower).filter(Boolean);

  return entries
    .map((entry) => {
      const triggerMatches = [
        ...asList(entry.data.triggers).map((signal) => normalizeSignal(signal, 'path')),
        ...asList(entry.data['anti-pattern-signals']).map((signal) =>
          normalizeSignal(signal, 'diff'),
        ),
        ...asList(entry.data['positive-pattern-signals']).map((signal) =>
          normalizeSignal(signal, 'helper'),
        ),
      ]
        .filter(Boolean)
        .filter((signal) =>
          signalMatches(signal, {
            changedPaths,
            diffText: normalizedDiffText,
            terms: normalizedTerms,
            scopes: normalizedScopes,
          }),
        );

      return triggerMatches.length > 0
        ? {
            entry,
            signals: triggerMatches,
          }
        : undefined;
    })
    .filter(Boolean);
};

const bumpEntryStats = (usageStats, entryPath) => {
  usageStats.entries[entryPath] = {
    ...(usageStats.entries[entryPath] ?? {}),
  };

  return usageStats.entries[entryPath];
};

const bumpSignatureStats = (usageStats, signature) => {
  usageStats.signatures[signature] = {
    ...(usageStats.signatures[signature] ?? {}),
  };

  return usageStats.signatures[signature];
};

export const recordShownDigests = ({ usageStats, entries, nowIso }) => {
  entries.forEach((entry) => {
    const entryStats = bumpEntryStats(usageStats, entry.memoryRelativePath);
    entryStats.shownCount = Number(entryStats.shownCount ?? 0) + 1;
    entryStats.lastShownAt = nowIso;
  });

  return usageStats;
};

export const recordOutcomeFeedback = ({
  usageStats,
  entries,
  shownEntryPaths = [],
  usedEntryPaths = [],
  falsePositiveEntryPaths = [],
  repeatedEntryPaths = [],
  preventedEntryPaths = [],
  nowIso,
}) => {
  const entryByPath = new Map(entries.map((entry) => [entry.memoryRelativePath, entry]));

  shownEntryPaths.forEach((entryPath) => {
    const entryStats = bumpEntryStats(usageStats, entryPath);
    entryStats.lastConsideredAt = nowIso;
  });

  usedEntryPaths.forEach((entryPath) => {
    const entryStats = bumpEntryStats(usageStats, entryPath);
    entryStats.useCount = Number(entryStats.useCount ?? 0) + 1;
    entryStats.lastUsedAt = nowIso;
  });

  falsePositiveEntryPaths.forEach((entryPath) => {
    const entryStats = bumpEntryStats(usageStats, entryPath);
    entryStats.falsePositiveCount = Number(entryStats.falsePositiveCount ?? 0) + 1;
  });

  preventedEntryPaths.forEach((entryPath) => {
    const entryStats = bumpEntryStats(usageStats, entryPath);
    entryStats.preventedRepeatCount = Number(entryStats.preventedRepeatCount ?? 0) + 1;
  });

  repeatedEntryPaths.forEach((entryPath) => {
    const entry = entryByPath.get(entryPath);
    const entryStats = bumpEntryStats(usageStats, entryPath);
    entryStats.repeatCount = Number(entryStats.repeatCount ?? 0) + 1;
    entryStats.lastMissedAt = nowIso;
    entryStats.promotionPriority = clamp(Number(entryStats.promotionPriority ?? 0) + 1, 0, 6);

    if (entry) {
      const signatureStats = bumpSignatureStats(usageStats, deriveRepeatSignature(entry));
      signatureStats.repeatCount = Number(signatureStats.repeatCount ?? 0) + 1;
      signatureStats.lastMissedAt = nowIso;
      signatureStats.promotionPriority = clamp(
        Number(signatureStats.promotionPriority ?? 0) + 1,
        0,
        6,
      );
    }
  });

  return usageStats;
};

export const getRepeatPressure = (usageStats, entry) => {
  const signal = getEntryUtilitySignal(usageStats, entry);

  return {
    repeatCount: signal.repeatCount,
    promotionPriority: signal.promotionPriority,
    shouldEscalatePromotion:
      signal.repeatCount >= 2 || signal.promotionPriority >= 3 || signal.preventedRepeatCount >= 2,
  };
};

export const buildLearningCandidate = ({ review, relatedEntries = [] }) => {
  const strongestSignal =
    review.relatedEntries.find(({ entry }) => entry.data.kind === 'correction') ??
    review.relatedEntries[0];
  const candidateScope = unique(
    strongestSignal
      ? strongestSignal.touchedFiles
      : review.changedNonMemoryPaths.filter((filePath) => !filePath.startsWith('.project-memory/')),
  ).slice(0, 3);
  const candidateKind = strongestSignal?.entry.data.kind === 'correction' ? 'correction' : 'lesson';
  const candidateRule =
    strongestSignal?.entry.data.correction ??
    strongestSignal?.entry.data.rule ??
    'Summarize the reusable rule confirmed by this diff.';
  const candidateWhy =
    strongestSignal?.entry.data.why ??
    'Describe the concrete regression or repeated mistake this lesson prevents.';
  const evidenceRef =
    review.strongerArtifactMatches[0]?.filePath ??
    review.changedNonMemoryPaths[0] ??
    '.project-memory/README.md';
  const triggerReason =
    review.triggerMatches?.[0]?.signals?.[0]?.value ??
    review.learningSignals[0] ??
    'When this risky behavior appears again.';
  const resolution =
    review.changedMemoryEntryPaths.length > 0
      ? 'covered-by-existing-diff'
      : review.learningResolutions.coveredBy.size > 0
        ? 'covered-by'
        : 'candidate';

  return {
    resolution,
    reason: unique([
      ...review.learningSignals,
      ...review.triggerMatches.map(({ entry }) => `triggered by ${entry.relativePath}`),
    ]).slice(0, 4),
    draftText: `---
scope:
${candidateScope.length > 0 ? candidateScope.map((scope) => `  - ${scope}`).join('\n') : '  - src/path/or/library'}
kind: ${candidateKind}
rule: ${candidateRule}
why: ${candidateWhy}
evidence:
  - type: code
    ref: ${evidenceRef}
    note: Replace with the focused proof from this change.
status: draft
confidence: medium
promotion-target:
  artifact: test
  ref: ${evidenceRef}
  trigger: Promote when this lesson repeats or becomes enforceable.
review-trigger:
  - ${triggerReason}
last-verified-at: ${new Date().toISOString().slice(0, 10)}
---

Keep this candidate only if the current diff really proved a reusable lesson. Otherwise reject it or close with covered-by.`,
  };
};
