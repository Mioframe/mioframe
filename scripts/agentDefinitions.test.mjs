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

  it('keeps Material ownership independent without recreating contexts per finding', () => {
    const componentRoot = readText('.agents/skills/material-component/SKILL.md');
    const foundationRoot = readText('.agents/skills/material-foundation/SKILL.md');
    const implementation = readText('.agents/skills/material-component-implementation/SKILL.md');
    const correctionReview = readText('.agents/skills/material-component-review/SKILL.md');
    const familyReview = readText('.agents/skills/material-family-review/SKILL.md');
    const componentContractTesting = readText('.agents/skills/component-contract-testing/SKILL.md');
    const documentationArchitecture = readText(
      'scripts/materialDocumentationArchitecture.test.mjs',
    );

    expect(componentRoot).toContain('coordination-only root');
    expect(componentRoot).toContain('must not edit production code');
    expect(componentRoot).toMatch(/Only the deepest owner may be implemented or reviewed/i);
    expect(componentRoot).toMatch(/real Agent\/subagent delegation primitive/i);
    expect(componentRoot).toMatch(/One outer root owns the entire recursive operation/i);
    expect(componentRoot).toContain('## Owner convergence pass');
    expect(componentRoot).toMatch(/same implementation context performs one consolidated correction pass/i);
    expect(componentRoot).toMatch(/same read-only reviewer re-reviews once/i);
    expect(componentRoot).toContain('## Preflight cadence');
    expect(componentRoot).toMatch(/Do not repeat the full repository\/family preflight/i);
    expect(componentRoot).toContain('## Verification cadence');
    expect(componentRoot).toMatch(/Do not run full `pnpm verify` for every owner/i);
    expect(componentRoot).toContain('## Verification failure attribution');
    expect(componentRoot).toMatch(/run the exact failing command\/lane on current head/i);
    expect(componentRoot).toMatch(/terminal result without family review/i);
    expect(componentRoot).not.toMatch(/new implementation context per small finding/i);

    expect(foundationRoot).toContain('coordination-only root');
    expect(foundationRoot).toMatch(/same implementation context performs one consolidated correction pass/i);
    expect(foundationRoot).toMatch(/same reviewer re-reviews once/i);
    expect(foundationRoot).toMatch(/Do not run full `pnpm verify` after each owner/i);

    expect(implementation).toContain('Owner kind: component | foundation');
    expect(implementation).toContain('Owner pass: initial | review-correction');
    expect(implementation).toContain('fresh-isolated-writable | resumed-isolated-writable');
    expect(implementation).toMatch(/same isolated writable owner context/i);
    expect(implementation).toMatch(/all known in-owner defects/i);
    expect(implementation).toContain('Readiness claim: forbidden');
    expect(implementation).toContain('Review required: yes');
    expect(implementation).not.toContain(
      'a new fresh writable context receives the consolidated findings',
    );

    expect(correctionReview).toContain('Review context: fresh-isolated-read-only');
    expect(correctionReview).toMatch(/same reviewer context may be resumed once/i);
    expect(correctionReview).toMatch(/return all actionable in-owner findings together/i);
    expect(correctionReview).toContain('Unresolved gap reconciliation:');
    expect(correctionReview).toContain('Sentinel/value-state compatibility:');
    expect(correctionReview).toContain('Changed-owner consumer compatibility:');
    expect(correctionReview).toContain('Stack transition authorized: yes | no');

    expect(familyReview).toContain('Review context: fresh-isolated-read-only');
    expect(familyReview).toContain('Prior family context reused: no');
    expect(familyReview).toContain('Unresolved gap reconciliation:');
    expect(familyReview).toContain('Sentinel/value-state compatibility:');
    expect(familyReview).toContain('Changed-owner consumer compatibility:');
    expect(familyReview).toContain('Verification attribution:');

    expect(componentContractTesting).toMatch(/sentinel or boundary semantics/i);
    expect(componentContractTesting).toMatch(/documented invalid-value behavior/i);
    expect(documentationArchitecture).toMatch(
      /blocked roadmap next action must describe the external unblock/i,
    );
  });
});
