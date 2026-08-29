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

    expect(result.errors).toContainEqual(
      expect.stringContaining('.agents/skills/architect-handoff/SKILL.md'),
    );
    expect(result.errors).not.toContainEqual(
      expect.stringContaining('.agents/skills/material-component/SKILL.md'),
    );
  });

  it('accepts the current three-contract Material handoff', () => {
    const root = makeTempRepo({
      '.agents/skills/architect-handoff/SKILL.md':
        '# Architecture handoff\n\nThe Material ready gate is `contract.ts`, `tokens.css`, and `BEHAVIOR.md`.\n',
    });

    expect(checkMaterialWorkflowGuidance(root).errors).toHaveLength(0);
  });

  it('fails closed when architect-handoff stops naming the current ready artifacts', () => {
    const root = makeTempRepo({
      '.agents/skills/architect-handoff/SKILL.md':
        '# Architecture handoff\n\nUse the current Material workflow when it is ready.\n',
    });

    const result = checkMaterialWorkflowGuidance(root);

    expect(result.errors).toContainEqual(
      expect.stringContaining('must name the current Material ready artifacts'),
    );
  });
});
