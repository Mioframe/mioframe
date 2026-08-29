import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { checkMaterialWorkflowGuidance } from './agentEnvironment.mjs';

let tempRoot = null;

function makeTempRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'material-workflow-guidance-'));

  for (const [relPath, content] of Object.entries(files)) {
    const absPath = path.join(root, relPath);
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, content, 'utf8');
  }

  tempRoot = root;
  return root;
}

afterEach(() => {
  if (tempRoot !== null) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    tempRoot = null;
  }
});

describe('Material workflow guidance consistency', () => {
  it('rejects legacy staged ready-contract guidance outside the transition owner', () => {
    const root = makeTempRepo({
      '.agents/skills/architect-handoff/SKILL.md':
        '# Architecture handoff\n\nFor Material, require current `DESIGN.md` and ready `ARCHITECTURE.md`.\n',
      '.agents/skills/material-component/SKILL.md':
        '# Material component\n\nTemporary legacy bridge: old `DESIGN.md` and `ARCHITECTURE.md` may remain during conversion.\n',
    });

    const result = checkMaterialWorkflowGuidance(root);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('.agents/skills/architect-handoff/SKILL.md');
  });

  it('accepts current Material guidance without duplicating the canonical ready contract', () => {
    const root = makeTempRepo({
      '.agents/skills/architect-handoff/SKILL.md':
        '# Architecture handoff\n\nUse `material-component` as the deterministic Material workflow.\n',
    });

    expect(checkMaterialWorkflowGuidance(root).errors).toHaveLength(0);
  });

  it('rejects the superseded Material ready contract in AGENTS.md guidance', () => {
    const root = makeTempRepo({
      'AGENTS.md': '# Rules\n\nMaterial requires `DESIGN.md` and `ARCHITECTURE.md` before implementation.\n',
    });

    const result = checkMaterialWorkflowGuidance(root);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('AGENTS.md');
  });
});
