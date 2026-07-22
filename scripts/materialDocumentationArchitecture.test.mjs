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
const MATERIAL_COMMAND = /\b(material-component|material-foundation)\s+([^`;,.]+)/g;

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
    /^\s*(?:Current objective|Current stage|Current correction unit|Next gate|Contract review status|Final review status|Family review status|Family alignment status|Alignment status|Prerequisite stack|Continuation stack|Checkpoint reason|Completed correction units|Remaining required gaps|Next action|Blocker):/im,
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

function materialCommands(value) {
  return [...value.matchAll(MATERIAL_COMMAND)].map((match) => ({
    command: match[1],
    root: match[2].trim(),
  }));
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
    /^Active root: `[^`]+`$/,
    /^Alignment status: `(aligned|converging|blocked)`$/,
    /^Continuation stack: `(?:none|[^`]+)`$/,
    /^Checkpoint reason: `[^`]+`$/,
    /^External blocker: .+$/,
    '## Next action',
    /^(?![-*+]\s|\d+\.\s).+$/,
    '## Update rule',
    'Keep only the active root, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.',
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

  const activeRoot = lines[2]?.match(/^Active root: `([^`]+)`$/)?.[1];
  const status = lines[3]?.match(/^Alignment status: `(aligned|converging|blocked)`$/)?.[1];
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
    if (!activeRoot || owners[0] !== activeRoot || owners.some((owner) => !owner)) {
      errors.push('continuation stack must start with the active root');
    }
  }

  const commands = materialCommands(nextAction);

  if (status === 'converging') {
    const resume = nextAction.match(
      /^Resume `(material-component|material-foundation) ([^`]+)`(?:;|\.|$)/,
    );
    if (!resume || resume[2] !== activeRoot) {
      errors.push('converging roadmap next action must resume the active root command');
    }

    const hasNestedCommand = commands.some(
      (command, index) => index > 0 || !activeRoot || command.root !== activeRoot,
    );
    if (hasNestedCommand) {
      errors.push('roadmap next action must not delegate an internal prerequisite');
    }
  }

  if (status === 'blocked' && commands.length > 0) {
    errors.push(
      'blocked roadmap next action must describe the external unblock, not launch a Material root',
    );
  }

  return errors.sort();
}

function repositoryReadmes() {
  return OWNER_ROOTS.flatMap(walkOwnerReadmes).map((filePath) => ({
    filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));
}

function roadmapFixture({
  activeRoot = 'Button',
  status = 'converging',
  stack = 'Button > Progress Indicator',
  checkpointReason = 'context-exhausted',
  blocker = 'none',
  nextAction = 'Resume `material-component Button`; continue from the deepest unfinished owner.',
} = {}) {
  return `# Material library roadmap

## Current state

Active root: \`${activeRoot}\`

Alignment status: \`${status}\`

Continuation stack: \`${stack}\`

Checkpoint reason: \`${checkpointReason}\`

External blocker: ${blocker}

## Next action

${nextAction}

## Update rule

Keep only the active root, alignment status, one continuation stack, one checkpoint reason, exact external blocker, and one next action.
`;
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
      analyzeRoadmap(
        roadmapFixture({
          nextAction: '1. Completed token migration\n2. pnpm verify passed',
        }),
      ),
    ).not.toEqual([]);
  });

  it('rejects delegation of a nested prerequisite while converging', () => {
    const errors = analyzeRoadmap(
      roadmapFixture({
        nextAction: 'Resume `material-component Button`; then run `material-foundation tokens`.',
      }),
    );

    expect(errors).toContain('roadmap next action must not delegate an internal prerequisite');
  });

  it('rejects launching another Material root from blocked state', () => {
    const errors = analyzeRoadmap(
      roadmapFixture({
        status: 'blocked',
        stack: 'none',
        checkpointReason: 'none',
        blocker: 'legacy Icon Button and FAB verification failures',
        nextAction: 'Run `material-component icon-button` and `material-component fab`.',
      }),
    );

    expect(errors).toContain(
      'blocked roadmap next action must describe the external unblock, not launch a Material root',
    );
  });

  it('rejects checkpointing without an allowed physical reason', () => {
    expect(
      analyzeRoadmap(
        roadmapFixture({
          stack: 'Button > foundation/tokens',
          checkpointReason: 'next-owner-is-large',
        }),
      ),
    ).toEqual([expect.stringContaining('allowed physical-reason enum')]);
  });

  it('accepts one minimal component-root continuation checkpoint', () => {
    expect(
      analyzeRoadmap(
        roadmapFixture({
          stack: 'Button > Progress Indicator > foundation/tokens',
          checkpointReason: 'isolated-review-context-unavailable',
          nextAction:
            'Resume `material-component Button`; validate the stack against current code and continue from the deepest unfinished owner.',
        }),
      ),
    ).toEqual([]);
  });

  it('accepts one minimal standalone-foundation continuation checkpoint', () => {
    expect(
      analyzeRoadmap(
        roadmapFixture({
          activeRoot: 'tokens',
          stack: 'tokens > system/elevation',
          nextAction:
            'Resume `material-foundation tokens`; validate the stack against current code and continue from the deepest unfinished owner.',
        }),
      ),
    ).toEqual([]);
  });

  it('keeps owner README files limited to durable contracts', () => {
    expect(analyzeOwnerReadmes(repositoryReadmes())).toEqual([]);
  });

  it('keeps roadmap limited to one compact current-state record', () => {
    expect(analyzeRoadmap(fs.readFileSync(ROADMAP_PATH, 'utf8'))).toEqual([]);
  });
});
