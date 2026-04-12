import { describe, expect, it } from 'vitest';

import {
  buildLearningCandidate,
  createEmptyUsageStats,
  createEntryDigest,
  detectEntryTriggerMatches,
  deriveRepeatSignature,
  getEntryUtilitySignal,
  recordOutcomeFeedback,
  renderMemoryDigest,
} from './projectMemoryBehavior.mjs';
import { isActiveTaskState, rankEntries } from './projectMemoryUtils.mjs';

const createEntry = (overrides: Record<string, unknown> = {}) => {
  const data = {
    scope: ['src/shared/lib/changeObject'],
    kind: 'correction',
    rule: 'Use deepPatchJsonObject for partial updates.',
    why: 'Partial updates must not delete omitted keys.',
    mistake: 'Using deepPutJsonObject during partial updates.',
    correction: 'Switch to deepPatchJsonObject for partial update flows.',
    'applies-when': ['Editing nested records incrementally.'],
    evidence: [
      {
        type: 'test',
        ref: 'src/shared/lib/changeObject/deepPatchJsonObject.test.ts:10',
        note: 'Shows omission preserves keys.',
      },
    ],
    status: 'verified',
    confidence: 'high',
    'promotion-target': {
      artifact: 'test',
      ref: 'src/shared/lib/changeObject/deepPatchJsonObject.test.ts',
      trigger: 'Promote when repeated.',
    },
    'review-trigger': ['When helper semantics change.'],
    'last-verified-at': '2026-04-12',
    ...overrides,
  };
  const slug = `${String(data.rule)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')}.md`;

  return {
    absolutePath: `/tmp/${slug}`,
    relativePath: `.project-memory/verified/${slug}`,
    memoryRelativePath: `verified/${slug}`,
    directory: 'verified',
    body: 'Compact body.',
    content: '',
    data,
  };
};

describe('project memory ranking and digest', () => {
  it('boosts entries with practical utility signals', () => {
    const highValue = createEntry({
      rule: 'Re-read mounted directories after create.',
      scope: ['src/shared/service/fileSystem'],
    });
    const lowValue = createEntry({
      rule: 'Generic helper note.',
      scope: ['src/shared/service/fileSystem'],
    });
    const usageStats = createEmptyUsageStats();

    usageStats.entries[highValue.memoryRelativePath] = {
      useCount: 3,
      preventedRepeatCount: 2,
    };
    usageStats.entries[lowValue.memoryRelativePath] = {
      falsePositiveCount: 2,
    };

    const ranked = rankEntries([lowValue, highValue], {
      scopeQueries: ['src/shared/service/fileSystem'],
      termQueries: ['create'],
      usageStats,
    });

    expect(ranked[0]?.entry.memoryRelativePath).toBe(highValue.memoryRelativePath);
    expect(ranked[0]?.reasons.join(' ')).toContain('usage=');
  });

  it('renders compact digests and suppresses repeated entries', () => {
    const entry = createEntry();
    const digestLines = createEntryDigest(entry);
    const rendered = renderMemoryDigest([{ entry, score: 10, reasons: [] }], {
      suppressEntryPaths: [entry.memoryRelativePath],
    });

    expect(digestLines.join('\n')).toContain('rule:');
    expect(digestLines.join('\n')).toContain('avoid:');
    expect(digestLines.join('\n')).toContain('use instead:');
    expect(digestLines.join('\n')).toContain('trigger:');
    expect(rendered.lines).toEqual([]);
  });
});

describe('repeat pressure and triggers', () => {
  it('tracks repeat pressure through the usage index', () => {
    const entry = createEntry();
    const usageStats = createEmptyUsageStats();
    const signature = deriveRepeatSignature(entry);

    usageStats.signatures[signature] = {
      repeatCount: 2,
      promotionPriority: 3,
    };

    const signal = getEntryUtilitySignal(usageStats, entry);

    expect(signal.repeatCount).toBe(2);
    expect(signal.promotionPriority).toBe(3);
    expect(signal.utilityScore).toBeGreaterThan(0);
  });

  it('matches trigger signals from path, helper name, and diff text', () => {
    const entry = createEntry({
      triggers: [{ type: 'path', value: 'src/shared/lib/changeObject' }],
      'anti-pattern-signals': [{ type: 'diff', value: 'deepputjsonobject' }],
      'positive-pattern-signals': [{ type: 'helper', value: 'deeppatchjsonobject' }],
    });

    const matches = detectEntryTriggerMatches([entry], {
      changedPaths: ['src/shared/lib/changeObject/applyThing.ts'],
      diffText: '+ use deepPutJsonObject\n+ use deepPatchJsonObject',
      terms: ['partial'],
      scopes: ['src/shared/lib/changeObject'],
    });

    expect(matches).toHaveLength(1);
    expect(matches[0]?.signals).toHaveLength(3);
  });
});

describe('candidate generation and feedback loop', () => {
  it('builds a learning candidate from risky review context', () => {
    const entry = createEntry();
    const candidate = buildLearningCandidate({
      review: {
        relatedEntries: [{ entry, touchedFiles: ['src/shared/lib/changeObject/applyThing.ts'] }],
        strongerArtifactMatches: [
          { filePath: 'src/shared/lib/changeObject/applyThing.test.ts', kinds: ['test'] },
        ],
        changedNonMemoryPaths: ['src/shared/lib/changeObject/applyThing.ts'],
        changedMemoryEntryPaths: [],
        learningSignals: [
          'stronger artifacts changed: src/shared/lib/changeObject/applyThing.test.ts [test]',
        ],
        learningResolutions: { coveredBy: new Set() },
        triggerMatches: [{ entry, signals: [{ value: 'deepPutJsonObject' }] }],
      },
    });

    expect(candidate.resolution).toBe('candidate');
    expect(candidate.draftText).toContain('kind: correction');
    expect(candidate.reason.join('\n')).toContain('stronger artifacts changed');
  });

  it('accounts for used, prevented, and noisy entries', () => {
    const entry = createEntry();
    const usageStats = createEmptyUsageStats();

    recordOutcomeFeedback({
      usageStats,
      entries: [entry],
      shownEntryPaths: [entry.memoryRelativePath],
      usedEntryPaths: [entry.memoryRelativePath],
      falsePositiveEntryPaths: [],
      repeatedEntryPaths: [entry.memoryRelativePath],
      preventedEntryPaths: [entry.memoryRelativePath],
      nowIso: '2026-04-12T10:00:00.000Z',
    });

    expect(usageStats.entries[entry.memoryRelativePath]?.useCount).toBe(1);
    expect(usageStats.entries[entry.memoryRelativePath]?.preventedRepeatCount).toBe(1);
    expect(usageStats.entries[entry.memoryRelativePath]?.repeatCount).toBe(1);
    expect(usageStats.entries[entry.memoryRelativePath]?.promotionPriority).toBe(1);
  });
});

describe('backward compatibility', () => {
  it('still accepts legacy active task state shapes', () => {
    expect(
      isActiveTaskState({
        exactScopes: ['src/shared/lib/changeObject'],
        parentScopes: [],
        boundaryScopes: [],
        lookupScopes: ['src/shared/lib/changeObject'],
        taskTerms: ['partial'],
        matchedEntries: [],
      }),
    ).toBe(true);
  });
});
