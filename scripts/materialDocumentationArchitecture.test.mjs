import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MATERIAL_ROOT = path.join(ROOT, 'src', 'shared', 'ui', 'material');
const OWNER_ROOTS = ['components', 'foundation', 'patterns'].map((name) =>
  path.join(MATERIAL_ROOT, name),
);

const FORBIDDEN = [
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
    /^\s*(?:Current objective|Current stage|Current correction unit|Next gate|Contract review status|Final review status|Family review status|Family alignment status|Prerequisite stack|Completed correction units|Remaining required gaps|Next action|Blocker):/im,
  ],
];

function normalize(filePath) {
  return filePath.split(path.sep).join('/');
}

function walkOwnerReadmes(directory) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkOwnerReadmes(entryPath));
    } else if (entry.isFile() && entry.name === 'README.md') {
      files.push(entryPath);
    }
  }
  return files;
}

function analyze(readmes) {
  const errors = [];
  for (const { filePath, content } of readmes) {
    for (const [label, pattern] of FORBIDDEN) {
      if (pattern.test(content)) {
        errors.push(`${normalize(path.relative(ROOT, filePath))}: forbidden ${label}`);
      }
    }
  }
  return errors.sort();
}

function repositoryReadmes() {
  return OWNER_ROOTS.flatMap(walkOwnerReadmes).map((filePath) => ({
    filePath,
    content: fs.readFileSync(filePath, 'utf8'),
  }));
}

describe('Material owner documentation architecture', () => {
  it('detects persisted execution state and review history', () => {
    const fixturePath = path.join(MATERIAL_ROOT, 'components', 'fixture', 'README.md');
    const errors = analyze([
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

  it('keeps owner README files limited to durable contracts', () => {
    expect(analyze(repositoryReadmes())).toEqual([]);
  });
});
