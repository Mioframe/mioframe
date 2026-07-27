import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import { afterEach, describe, expect, it } from 'vitest';

import { checkAgentEnvironment } from './agentEnvironment.mjs';

const tempDirs = [];

afterEach(() => {
  for (const directory of tempDirs) {
    fs.rmSync(directory, { recursive: true, force: true });
  }

  tempDirs.length = 0;
});

function createRepo() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-guidance-'));
  tempDirs.push(root);
  fs.writeFileSync(
    path.join(root, '.gitignore'),
    '.claude/*\n!.claude/skills\n!.claude/skills/**\n.claude/settings.local.json\n',
    'utf8',
  );
  fs.writeFileSync(path.join(root, 'AGENTS.md'), '# Rules\n', 'utf8');
  fs.mkdirSync(path.join(root, '.agents', 'skills'), { recursive: true });
  const result = spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'git init failed');
  }

  return root;
}

describe('agent environment repair guidance', () => {
  it('recommends scoped fix-only mode without the combined fix command', () => {
    const result = checkAgentEnvironment(createRepo(), false);
    const messages = result.errors.join('\n');

    expect(messages).toContain('pnpm verify --fix-only');
    expect(messages).not.toMatch(/pnpm verify --fix(?:\s|`|$)/);
  });
});
