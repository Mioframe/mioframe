import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_ROOT = path.join(ROOT, '.agents', 'skills');
const CLAUDE_AGENTS_ROOT = path.join(ROOT, '.claude', 'agents');

function readText(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), 'utf8');
}

function extractFrontmatter(content, relativePath) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    throw new Error(`Missing YAML frontmatter: ${relativePath}`);
  }

  return match[1];
}

function topLevelKeys(frontmatter) {
  return [...frontmatter.matchAll(/^([a-zA-Z][a-zA-Z0-9-]*):/gm)].map((match) => match[1]);
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['\"]?([^'\"\\n]+)['\"]?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function listItemExists(frontmatter, key, value) {
  const block = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:  - .+\\n?)*)`, 'm'))?.[1] ?? '';
  return block
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean)
    .includes(value);
}

function skillDirectories() {
  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function claudeAgentFiles() {
  return fs
    .readdirSync(CLAUDE_AGENTS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name)
    .sort();
}

describe('portable Agent Skills', () => {
  it('keeps Material workflow skills on standard frontmatter', () => {
    const materialSkillNames = skillDirectories().filter(
      (name) => name.startsWith('material-') || name === 'material3-guidelines',
    );

    expect(materialSkillNames.length).toBeGreaterThan(0);

    for (const directoryName of materialSkillNames) {
      const relativePath = `.agents/skills/${directoryName}/SKILL.md`;
      const content = readText(relativePath);
      const frontmatter = extractFrontmatter(content, relativePath);

      expect(topLevelKeys(frontmatter), relativePath).toEqual(['name', 'description']);
      expect(scalar(frontmatter, 'name'), relativePath).toBe(directoryName);

      const description = scalar(frontmatter, 'description');
      expect(description, relativePath).not.toBeNull();
      expect(description.length, relativePath).toBeLessThanOrEqual(1024);
    }
  });

  it('uses unique skill names', () => {
    const owners = new Map();

    for (const directoryName of skillDirectories()) {
      const relativePath = `.agents/skills/${directoryName}/SKILL.md`;
      const frontmatter = extractFrontmatter(readText(relativePath), relativePath);
      const name = scalar(frontmatter, 'name');

      expect(name, relativePath).not.toBeNull();
      expect(owners.has(name), `Duplicate skill name '${name}'`).toBe(false);
      owners.set(name, relativePath);
    }
  });
});

describe('Claude project agent adapters', () => {
  const expectedAdapters = new Map([
    ['material-canonical-target.md', 'material-canonical-target'],
    ['material-contract-gate-reviewer.md', 'material-component-review'],
    ['material-current-state-auditor.md', 'material-current-state-audit'],
    ['material-final-reviewer.md', 'material-component-review'],
  ]);

  it('contains only the expected thin Material adapters', () => {
    expect(claudeAgentFiles()).toEqual([...expectedAdapters.keys()].sort());
  });

  it('preloads portable skills and keeps adapters read-only', () => {
    for (const [fileName, skillName] of expectedAdapters) {
      const relativePath = `.claude/agents/${fileName}`;
      const content = readText(relativePath);
      const frontmatter = extractFrontmatter(content, relativePath);
      const body = content.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
      const tools = scalar(frontmatter, 'tools') ?? '';

      expect(listItemExists(frontmatter, 'skills', skillName), relativePath).toBe(true);
      expect(fs.existsSync(path.join(SKILLS_ROOT, skillName, 'SKILL.md')), relativePath).toBe(true);
      expect(scalar(frontmatter, 'permissionMode'), relativePath).toBe('plan');
      expect(tools, relativePath).not.toMatch(/\b(?:Write|Edit|NotebookEdit|Bash|Agent|Task|Skill)\b/);
      expect(body.split('\n').filter(Boolean).length, relativePath).toBeLessThanOrEqual(2);
      expect(body, relativePath).not.toContain('##');
      expect(body, relativePath).not.toMatch(
        /confirmed-compliant|correction priority|MOTION ROUTE|workflow state|source decision/i,
      );
      expect(body, relativePath).toContain(skillName);
    }
  });
});
