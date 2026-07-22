import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATERIAL_ROOT = path.join(ROOT, 'src', 'shared', 'ui', 'material');
const ROADMAP_PATH = path.join(MATERIAL_ROOT, 'docs', 'roadmap.md');
const OWNER_ROOTS = ['components', 'foundation', 'patterns'].map((name) =>
  path.join(MATERIAL_ROOT, name),
);
const CHECKPOINT_REASONS = new Set([
  'none',
  'context-exhausted',
  'runtime-exhausted',
  'user-interrupted',
  'isolated-writable-context-unavailable',
  'isolated-review-context-unavailable',
  'required-tool-unavailable',
  'required-evidence-unavailable',
]);

const OWNER_FORBIDDEN = [
  ['workflow-state marker', /\bMATERIAL WORKFLOW STATE\b/i],
  [
    'execution-result marker',
    /\b(?:TASK RESULT|VERIFY RESULT|MATERIAL COMPONENT RESULT|MATERIAL FOUNDATION RESULT|MATERIAL STAGE RESULT)\b/i,
  ],
  [
    'execution-history heading',
    /^\s*#{1,6}\s+(?:correction units?|contract(?:-gate)? review history|final(?:-gate)? review|review history|workflow history|implementation history|backlog)\b/im,
  ],
  [
    'dynamic workflow field',
    /^\s*(?:Current objective|Current stage|Current correction unit|Next gate|Contract review status|Final review status|Family review status|Family alignment status|Prerequisite stack|Continuation stack|Checkpoint reason|Completed correction units|Remaining required gaps|Next action|Blocker):/im,
  ],
];

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function walkOwnerReadmes(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkOwnerReadmes(entryPath);
    }
    return entry.isFile() && entry.name === 'README.md' ? [entryPath] : [];
  });
}

function analyzeOwnerReadmes(readmes) {
  const errors = [];
  for (const { filePath, content } of readmes) {
    for (const [label, pattern] of OWNER_FORBIDDEN) {
      if (pattern.test(content)) {
        errors.push(`${normalize(path.relative(ROOT, filePath))}: forbidden ${label}`);
      }
    }
  }
  return errors.sort();
}

function analyzeRoadmap(content) {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const errors = [];

  const expected = [
    '# Material library roadmap',
    '## Current state',
    /^Active family: `[^`]+`$/,
    /^Family alignment status: `(aligned|converging|blocked)`$/,
    /^Continuation stack: `(?:none|[^`]+)`$/,
    /^Checkpoint reason: `[^`]+`$/,
    /^External blocker: .+$/,
    '## Next action',
    /^(?![-*+]\s|\d+\.\s).+$/,
    '## Update rule',
    'Keep only the active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.',
  ];

  if (lines.length !== expected.length) {
    errors.push(`roadmap must contain exactly ${expected.length} non-empty contract lines`);
  }

  expected.forEach((matcher, index) => {
    const line = lines[index] ?? '';
    const matches = typeof matcher === 'string' ? line === matcher : matcher.test(line);
    if (!matches) {
      errors.push(`roadmap line ${index + 1} violates the compact contract`);
    }
  });

  const family = lines[2]?.match(/^Active family: `([^`]+)`$/)?.[1];
  const status = lines[3]?.match(/^Family alignment status: `(aligned|converging|blocked)`$/)?.[1];
  const stack = lines[4]?.match(/^Continuation stack: `([^`]+)`$/)?.[1];
  const checkpointReason = lines[5]?.match(/^Checkpoint reason: `([^`]+)`$/)?.[1];
  const blocker = lines[6]?.replace(/^External blocker:\s*/, '').trim();
  const nextAction = lines[8] ?? '';

  if (checkpointReason && !CHECKPOINT_REASONS.has(checkpointReason)) {
    errors.push('roadmap checkpoint reason must use the allowed physical-reason enum');
  }
  if (checkpointReason && checkpointReason !== 'none') {
    if (status !== 'converging') {
      errors.push('a physical checkpoint reason requires converging status');
    }
    if (stack === 'none') {
      errors.push('a physical checkpoint reason requires a non-empty continuation stack');
    }
  }
  if (status !== 'converging' && checkpointReason !== 'none') {
    errors.push('aligned or blocked roadmap status requires Checkpoint reason: none');
  }

  if (status === 'blocked' && blocker?.toLowerCase() === 'none') {
    errors.push('blocked roadmap status requires an exact external blocker');
  }
  if (status && status !== 'blocked' && blocker?.toLowerCase() !== 'none') {
    errors.push('only blocked roadmap status may contain an external blocker');
  }

  if (status === 'aligned') {
    if (stack !== 'none') {
      errors.push('aligned roadmap status requires an empty continuation stack');
    }
    if (nextAction.toLowerCase() !== 'none') {
      errors.push('aligned roadmap status requires Next action: none');
    }
  }

  if (stack && stack !== 'none') {
    const owners = stack.split(' > ').map((owner) => owner.trim());
    if (!family || owners[0] !== family || owners.some((owner) => !owner)) {
      errors.push('continuation stack must start with the active root family');
    }
  }

  if (status === 'converging' && family) {
    const requiredPrefix = `Resume \`material-component ${family}\``;
    if (!nextAction.startsWith(requiredPrefix)) {
      errors.push('converging roadmap next action must resume the active root family');
    }
  }

  if (/\bmaterial-foundation\b/.test(nextAction)) {
    errors.push('roadmap next action must not delegate an internal foundation prerequisite');
  }

  const nestedComponent = nextAction.match(/\bmaterial-component\s+([^`;,.]+)/)?.[1]?.trim();
  if (nestedComponent && family && nestedComponent !== family) {
    errors.push('roadmap next action must not delegate a nested component prerequisite');
  }

  return errors.sort();
}

function repositoryReadmes() {
  return OWNER_ROOTS.flatMap(walkOwnerReadmes).map((filePath) => ({
    filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));
}

describe('Material documentation architecture', () => {
  it('detects persisted owner execution state and review history', () => {
    const fixturePath = path.join(MATERIAL_ROOT, 'components', 'fixture', 'README.md');
    const errors = analyzeOwnerReadmes([
      {
        filePath: fixturePath,
        content: `# Fixture

MATERIAL WORKFLOW STATE
Current stage: implementation

## Correction units

TASK RESULT
`,
      },
    ]);

    expect(errors).toEqual([
      expect.stringContaining('dynamic workflow field'),
      expect.stringContaining('execution-history heading'),
      expect.stringContaining('execution-result marker'),
      expect.stringContaining('workflow-state marker'),
    ]);
  });

  it('rejects roadmap execution logs', () => {
    expect(
      analyzeRoadmap(`# Material library roadmap

## Current state

Active family: \`Button\`
Family alignment status: \`converging\`
Continuation stack: \`Button > Progress Indicator\`
Checkpoint reason: \`context-exhausted\`
External blocker: none

1. Completed token migration
2. pnpm verify passed

## Next action

Run another pass.

## Update rule

Keep only the active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
`),
    ).not.toEqual([]);
  });

  it('rejects delegation of a nested prerequisite to the operator', () => {
    const errors = analyzeRoadmap(`# Material library roadmap

## Current state

Active family: \`Button\`
Family alignment status: \`converging\`
Continuation stack: \`Button > Progress Indicator\`
Checkpoint reason: \`context-exhausted\`
External blocker: none

## Next action

Run \`material-component Progress Indicator\`, then resume Button.

## Update rule

Keep only the active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
`);

    expect(errors).toEqual([
      expect.stringContaining('converging roadmap next action must resume the active root family'),
      expect.stringContaining('roadmap next action must not delegate a nested component prerequisite'),
    ]);
  });

  it('rejects checkpointing without an allowed physical reason', () => {
    expect(
      analyzeRoadmap(`# Material library roadmap

## Current state

Active family: \`Button\`
Family alignment status: \`converging\`
Continuation stack: \`Button > foundation/tokens\`
Checkpoint reason: \`next-owner-is-large\`
External blocker: none

## Next action

Resume \`material-component Button\`; continue from the deepest unfinished owner.

## Update rule

Keep only the active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
`),
    ).toEqual([expect.stringContaining('allowed physical-reason enum')]);
  });

  it('accepts one minimal root-family continuation checkpoint', () => {
    expect(
      analyzeRoadmap(`# Material library roadmap

## Current state

Active family: \`Button\`
Family alignment status: \`converging\`
Continuation stack: \`Button > Progress Indicator > foundation/tokens\`
Checkpoint reason: \`isolated-review-context-unavailable\`
External blocker: none

## Next action

Resume \`material-component Button\`; validate the stack against current code and continue from the deepest unfinished owner.

## Update rule

Keep only the active root family, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
`),
    ).toEqual([]);
  });

  it('keeps owner README files limited to durable contracts', () => {
    expect(analyzeOwnerReadmes(repositoryReadmes())).toEqual([]);
  });

  it('keeps roadmap limited to one compact current-state record', () => {
    expect(analyzeRoadmap(fs.readFileSync(ROADMAP_PATH, 'utf8'))).toEqual([]);
  });
});
