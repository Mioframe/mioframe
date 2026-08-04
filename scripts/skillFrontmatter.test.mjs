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
  it('accepts project-required name and description', () => {
    const root = writeSkill(
      'valid-skill',
      `---\nname: valid-skill\ndescription: 'Valid test skill.'\n---\n\n# Valid\n`,
    );

    expect(checkSkillFrontmatter(root).errors).toHaveLength(0);
  });

  it('accepts documented paths routing metadata', () => {
    const root = writeSkill(
      'path-scoped-skill',
      `---\nname: path-scoped-skill\ndescription: 'Path-scoped test skill.'\npaths:\n  - 'src/**'\n---\n`,
    );

    expect(checkSkillFrontmatter(root).errors).toHaveLength(0);
  });

  it('rejects undocumented metadata fields', () => {
    const root = writeSkill(
      'invalid-skill',
      `---\nname: invalid-skill\ndescription: 'Invalid test skill.'\nroutes:\n  - 'src/**'\n---\n`,
    );

    expect(checkSkillFrontmatter(root).errors).toContainEqual(
      expect.stringContaining('undocumented Claude Code skill frontmatter keys: routes'),
    );
  });

  it('requires both project metadata fields', () => {
    const root = writeSkill('missing-description', `---\nname: missing-description\n---\n`);

    expect(checkSkillFrontmatter(root).errors).toContainEqual(
      expect.stringContaining("missing required project frontmatter key 'description'"),
    );
  });
});
