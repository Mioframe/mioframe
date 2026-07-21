import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_ROOT = path.join(ROOT, '.agents', 'skills');

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

function skillDirectories() {
  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

describe('portable Agent Skills', () => {
  it('uses one valid SKILL.md per directory with unique names and descriptions', () => {
    const owners = new Map();

    for (const directoryName of skillDirectories()) {
      const relativePath = `.agents/skills/${directoryName}/SKILL.md`;
      expect(fs.existsSync(path.join(ROOT, relativePath)), relativePath).toBe(true);

      const frontmatter = extractFrontmatter(readText(relativePath), relativePath);
      const name = scalar(frontmatter, 'name');
      const description = scalar(frontmatter, 'description');

      expect(name, relativePath).toBe(directoryName);
      expect(description, relativePath).not.toBeNull();
      expect(description?.length, relativePath).toBeGreaterThan(0);
      expect(owners.has(name), `Duplicate skill name '${name}'`).toBe(false);
      owners.set(name, relativePath);
    }
  });
});
