import fs from 'node:fs';

const files = ['scripts/agentEnvironment.mjs', 'scripts/agentEnvironment.test.mjs'];
const replacement =
  'Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or skill files under .agents/skills instead.';

for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  const next = source
    .replace(
      'Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\\\*/SKILL.md instead.',
      replacement,
    )
    .replace(
      'Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\*/SKILL.md instead.',
      replacement,
    )
    .replace(
      'Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/*/SKILL.md instead.',
      replacement,
    );

  if (next === source) {
    throw new Error(`[agent-compat-stabilize] expected compatibility text not found in ${filePath}`);
  }

  fs.writeFileSync(filePath, next, 'utf8');
}

console.log('[agent-compat-stabilize] updated canonical text and fixture');
