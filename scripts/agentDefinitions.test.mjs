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

      expect(name, relativePath).not.toBeNull();
      expect(name?.length, relativePath).toBeGreaterThan(0);
      expect(description, relativePath).not.toBeNull();
      expect(description?.length, relativePath).toBeGreaterThan(0);
      expect(owners.has(name), `Duplicate skill name '${name}'`).toBe(false);
      owners.set(name, relativePath);
    }
  });

  it('keeps Material orchestration, owner implementation, and review in separate contexts', () => {
    const componentRoot = readText('.agents/skills/material-component/SKILL.md');
    const foundationRoot = readText('.agents/skills/material-foundation/SKILL.md');
    const implementation = readText('.agents/skills/material-component-implementation/SKILL.md');
    const correctionReview = readText('.agents/skills/material-component-review/SKILL.md');
    const familyReview = readText('.agents/skills/material-family-review/SKILL.md');

    expect(componentRoot).toContain('coordination-only root');
    expect(componentRoot).toContain('must not edit production code');
    expect(componentRoot).toContain('Only the deepest unfinished owner');
    expect(componentRoot).toMatch(/fresh isolated writable owner context/i);
    expect(componentRoot).toMatch(/fresh isolated read-only review context/i);
    expect(componentRoot).toMatch(
      /one outer root orchestrator owns the entire recursive operation/i,
    );
    expect(componentRoot).toContain('Checkpoint reason: none | context-exhausted');
    expect(componentRoot).not.toContain(
      'execute the same owner units sequentially in the current runtime',
    );
    expect(componentRoot).not.toMatch(/nested `material-component` root operation/i);

    expect(foundationRoot).toContain('coordination-only root');
    expect(foundationRoot).toContain('must not edit production code');
    expect(foundationRoot).toContain('material-component-implementation');
    expect(foundationRoot).toContain('different fresh isolated read-only');
    expect(foundationRoot).not.toContain('Execution context: fresh-isolated-writable');

    expect(implementation).toContain('Owner kind: component | foundation');
    expect(implementation).toContain('Execution context: fresh-isolated-writable');
    expect(implementation).toContain('Readiness claim: forbidden');
    expect(implementation).toContain('Review required: yes');

    expect(correctionReview).toContain('Review context: fresh-isolated-read-only');
    expect(correctionReview).toContain('Implementation context reused: no');
    expect(correctionReview).toContain('Stack transition authorized: yes | no');

    expect(familyReview).toContain('Review context: fresh-isolated-read-only');
    expect(familyReview).toContain('Prior family context reused: no');
  });
});
