import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { checkSkillFrontmatter } from './agentEnvironment.mjs';

let tempRoot = null;

function writeSkill(name, content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-frontmatter-test-'));
  const skillPath = path.join(root, '.agents', 'skills', name, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, content, 'utf8');
  tempRoot = root;
  return root;
}

afterEach(() => {
  if (tempRoot) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe('Claude skill frontmatter', () => {
  it('accepts name and description only', () => {
    const root = writeSkill(
      'valid-skill',
      `---\nname: valid-skill\ndescription: 'Valid test skill.'\n---\n\n# Valid\n`,
    );

    expect(checkSkillFrontmatter(root).errors).toHaveLength(0);
  });

  it('rejects unsupported paths routing metadata', () => {
    const root = writeSkill(
      'invalid-skill',
      `---\nname: invalid-skill\ndescription: 'Invalid test skill.'\npaths:\n  - 'src/**'\n---\n`,
    );

    expect(checkSkillFrontmatter(root).errors).toContainEqual(
      expect.stringContaining('unsupported Claude Code skill frontmatter keys: paths'),
    );
  });

  it('requires both canonical metadata fields', () => {
    const root = writeSkill('missing-description', `---\nname: missing-description\n---\n`);

    expect(checkSkillFrontmatter(root).errors).toContainEqual(
      expect.stringContaining("missing required frontmatter key 'description'"),
    );
  });
});
