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

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*['"]?([^'"\\n]+)['"]?\\s*$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function listItems(frontmatter, key) {
  const block = frontmatter.match(new RegExp(`^${key}:\\s*\\n((?:  - .+\\n?)*)`, 'm'))?.[1] ?? '';
  return block
    .split('\n')
    .map((line) => line.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
}

function skillDirectories() {
  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function materialClaudeAgentFiles() {
  return fs
    .readdirSync(CLAUDE_AGENTS_ROOT, { withFileTypes: true })
    .filter(
      (entry) => entry.isFile() && entry.name.startsWith('material-') && entry.name.endsWith('.md'),
    )
    .map((entry) => entry.name)
    .sort();
}

describe('portable Agent Skills', () => {
  it('uses directory-matching unique names and descriptions', () => {
    const owners = new Map();

    for (const directoryName of skillDirectories()) {
      const relativePath = `.agents/skills/${directoryName}/SKILL.md`;
      const frontmatter = extractFrontmatter(readText(relativePath), relativePath);
      const name = scalar(frontmatter, 'name');
      const description = scalar(frontmatter, 'description');

      expect(name, relativePath).toBe(directoryName);
      expect(description, relativePath).not.toBeNull();
      expect(owners.has(name), `Duplicate skill name '${name}'`).toBe(false);
      owners.set(name, relativePath);
    }
  });
});

describe('Claude Material adapters', () => {
  it('preloads one existing portable skill and remains read-only', () => {
    for (const fileName of materialClaudeAgentFiles()) {
      const relativePath = `.claude/agents/${fileName}`;
      const frontmatter = extractFrontmatter(readText(relativePath), relativePath);
      const skills = listItems(frontmatter, 'skills');
      const tools = scalar(frontmatter, 'tools') ?? '';

      expect(skills, relativePath).toHaveLength(1);
      expect(fs.existsSync(path.join(SKILLS_ROOT, skills[0], 'SKILL.md')), relativePath).toBe(true);
      expect(scalar(frontmatter, 'permissionMode'), relativePath).toBe('plan');
      expect(tools, relativePath).not.toMatch(
        /\b(?:Write|Edit|NotebookEdit|Bash|Agent|Task|Skill)\b/,
      );
    }
  });
});
