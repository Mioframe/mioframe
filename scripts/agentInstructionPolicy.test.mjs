import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkAgentInstructionPolicy,
  findCanonicalInstructionFiles,
  normalizeInstructionContent,
  readSkillName,
} from './agentInstructionPolicy.mjs';

const temporaryRoots = [];

function createRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'mioframe-agent-policy-'));
  temporaryRoots.push(root);
  return root;
}

function writeFile(root, relativePath, content) {
  const absolutePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content, 'utf8');
}

afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('agent instruction policy', () => {
  it('finds canonical AGENTS and skill files while ignoring generated compatibility files', () => {
    const root = createRoot();
    writeFile(root, 'AGENTS.md', '# root\n');
    writeFile(root, 'src/AGENTS.md', '# src\n');
    writeFile(root, '.agents/skills/example/SKILL.md', '---\nname: example\n---\n');
    writeFile(root, '.claude/skills/example/SKILL.md', '---\nname: generated\n---\n');
    writeFile(root, 'docs/SKILL.md', 'not a canonical skill\n');

    expect(findCanonicalInstructionFiles(root)).toEqual([
      '.agents/skills/example/SKILL.md',
      'AGENTS.md',
      'src/AGENTS.md',
    ]);
  });

  it('normalizes exact legacy inheritance and verification forms', () => {
    expect(
      normalizeInstructionContent(
        'Applies until a deeper `AGENTS.md` overrides it. Run `pnpm type-check` and `pnpm lint:oxlint`.',
      ),
    ).toBe(
      'Applies until a deeper `AGENTS.md` refines it. Run `pnpm verify --only type-check` and `pnpm verify --only oxlint`.\n',
    );
  });

  it('reads quoted and unquoted skill names', () => {
    expect(readSkillName("---\nname: 'example-skill'\ndescription: test\n---\n")).toBe(
      'example-skill',
    );
    expect(readSkillName('---\nname: example-skill\n---\n')).toBe('example-skill');
  });

  it('reports stale instruction forms and skill-directory mismatches in check mode', () => {
    const root = createRoot();
    writeFile(root, 'AGENTS.md', 'Applies until a deeper `AGENTS.md` overrides it.');
    writeFile(root, '.agents/skills/example/SKILL.md', '---\nname: other\n---\n');

    const result = checkAgentInstructionPolicy(root, false);

    expect(result.fixes).toEqual([]);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('AGENTS.md contains a legacy instruction form'),
        expect.stringContaining("declares skill name 'other' but its directory is 'example'"),
      ]),
    );
  });

  it('applies safe normalization in fix mode', () => {
    const root = createRoot();
    writeFile(root, 'AGENTS.md', 'Run `pnpm type-check`.');
    writeFile(root, '.agents/skills/example/SKILL.md', '---\nname: example\n---\n');

    const result = checkAgentInstructionPolicy(root, true);

    expect(result.errors).toEqual([]);
    expect(result.fixes).toEqual(['normalized AGENTS.md']);
    expect(fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8')).toBe(
      'Run `pnpm verify --only type-check`.\n',
    );
  });
});
