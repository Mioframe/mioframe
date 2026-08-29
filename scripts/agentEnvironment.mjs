/**
 * Agent environment compatibility check/fix script.
 *
 * Ensures Claude Code can load project rules and skills that are canonically
 * defined in AGENTS.md files and .agents/skills, and keeps selected active
 * guidance contracts aligned with their canonical workflow owners.
 *
 * Usage:
 *   node scripts/agentEnvironment.mjs --check
 *   node scripts/agentEnvironment.mjs --fix
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const MANAGED_MARKER = '<!-- managed:agent-compat -->';

const REQUIRED_PROJECT_SKILL_FRONTMATTER_KEYS = new Set(['name', 'description']);
const SUPPORTED_SKILL_FRONTMATTER_KEYS = new Set([
  'name',
  'description',
  'when_to_use',
  'argument-hint',
  'arguments',
  'disable-model-invocation',
  'user-invocable',
  'allowed-tools',
  'model',
  'effort',
  'context',
  'agent',
  'hooks',
  'paths',
  'shell',
]);

const ROOT_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or canonical skill files under .agents/skills instead.
`;

const NESTED_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md
`;

const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
  'dist-ssr',
  'coverage',
  'playwright-report',
  'test-results',
  '.git',
  '.verify',
  '.stryker-tmp',
  'reports',
  'storybook-static',
  'temp',
  'tmp',
  '.sisyphus',
  '.opencode',
  '.claude',
]);

const ARCHITECT_HANDOFF_PATH = '.agents/skills/architect-handoff/SKILL.md';
const MATERIAL_LEGACY_BRIDGE_OWNER = '.agents/skills/material-component/SKILL.md';
const CURRENT_MATERIAL_READY_ARTIFACTS = ['`contract.ts`', '`tokens.css`', '`BEHAVIOR.md`'];

/**
 * Find matching files below a root while excluding generated and local state.
 * @param root Absolute search root.
 * @param fileName File name to match.
 * @returns Relative POSIX paths.
 */
function findNamedFiles(root, fileName) {
  const results = [];

  function visit(directory) {
    let entries;

    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(entryPath);
        }
        continue;
      }

      if (entry.isFile() && entry.name === fileName) {
        results.push(path.relative(root, entryPath).split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results.sort((left, right) => left.localeCompare(right));
}

function findAgentsMd(root) {
  return findNamedFiles(root, 'AGENTS.md');
}

function findClaudeMd(root) {
  return findNamedFiles(root, 'CLAUDE.md');
}

/**
 * Validate the narrow cross-file contract between active agent guidance and
 * the canonical Material workflow. Legacy staged artifact names are allowed
 * only in the Material orchestrator that owns the temporary conversion bridge;
 * generic active rules must use the current three-contract ready gate.
 * @param root Repository root.
 * @returns Material workflow guidance validation result.
 */
export function checkMaterialWorkflowGuidance(root) {
  const errors = [];
  const skillsRoot = path.join(root, '.agents', 'skills');
  const skillPaths = fs.existsSync(skillsRoot)
    ? findNamedFiles(skillsRoot, 'SKILL.md').map((skillRelPath) =>
        path.posix.join('.agents/skills', skillRelPath),
      )
    : [];
  const activeGuidancePaths = [...new Set([...findAgentsMd(root), ...skillPaths])].sort((left, right) =>
    left.localeCompare(right),
  );

  for (const guidancePath of activeGuidancePaths) {
    if (guidancePath === MATERIAL_LEGACY_BRIDGE_OWNER) {
      continue;
    }

    const content = fs.readFileSync(path.join(root, guidancePath), 'utf8');
    const namesLegacyMaterialReadyPair =
      /\bMaterial\b/i.test(content) &&
      content.includes('`DESIGN.md`') &&
      content.includes('`ARCHITECTURE.md`');

    if (namesLegacyMaterialReadyPair) {
      errors.push(
        `${guidancePath} references the superseded Material ready-artifact pair \`DESIGN.md\` + \`ARCHITECTURE.md\`. ` +
          `Legacy staged artifacts are owned only by ${MATERIAL_LEGACY_BRIDGE_OWNER}; active generic guidance must use the current three-contract workflow.`,
      );
    }
  }

  const architectHandoffAbsPath = path.join(root, ARCHITECT_HANDOFF_PATH);

  if (fs.existsSync(architectHandoffAbsPath)) {
    const architectHandoff = fs.readFileSync(architectHandoffAbsPath, 'utf8');
    const missingReadyArtifacts = CURRENT_MATERIAL_READY_ARTIFACTS.filter(
      (artifact) => !architectHandoff.includes(artifact),
    );

    if (missingReadyArtifacts.length > 0) {
      errors.push(
        `${ARCHITECT_HANDOFF_PATH} must name the current Material ready artifacts ${CURRENT_MATERIAL_READY_ARTIFACTS.join(', ')}; ` +
          `missing ${missingReadyArtifacts.join(', ')}.`,
      );
    }
  }

  return { errors, fixes: [] };
}

/**
 * Validate canonical Claude Code skill frontmatter.
 * @param root Repository root.
 * @returns Frontmatter validation result.
 */
export function checkSkillFrontmatter(root) {
  const skillsRoot = path.join(root, '.agents', 'skills');
  const errors = [];

  if (!fs.existsSync(skillsRoot)) {
    return { errors, fixes: [] };
  }

  for (const skillRelPath of findNamedFiles(skillsRoot, 'SKILL.md')) {
    const displayPath = path.posix.join('.agents/skills', skillRelPath);
    const content = fs.readFileSync(path.join(skillsRoot, skillRelPath), 'utf8');
    const lines = content.split(/\r?\n/);

    if (lines[0] !== '---') {
      errors.push(`${displayPath} must start with YAML frontmatter delimited by ---.`);
      continue;
    }

    const closingIndex = lines.indexOf('---', 1);

    if (closingIndex === -1) {
      errors.push(`${displayPath} has no closing --- for YAML frontmatter.`);
      continue;
    }

    const keys = [];

    for (const line of lines.slice(1, closingIndex)) {
      const match = /^([a-zA-Z0-9_-]+):(?:\s|$)/.exec(line);

      if (match) {
        keys.push(match[1]);
      }
    }

    for (const requiredKey of REQUIRED_PROJECT_SKILL_FRONTMATTER_KEYS) {
      if (!keys.includes(requiredKey)) {
        errors.push(`${displayPath} is missing required project frontmatter key '${requiredKey}'.`);
      }
    }

    const unsupportedKeys = [...new Set(keys)].filter(
      (key) => !SUPPORTED_SKILL_FRONTMATTER_KEYS.has(key),
    );

    if (unsupportedKeys.length > 0) {
      errors.push(
        `${displayPath} uses undocumented Claude Code skill frontmatter keys: ${unsupportedKeys.join(', ')}. ` +
          `Use documented frontmatter fields or put project routing instructions in the skill body.`,
      );
    }
  }

  return { errors, fixes: [] };
}

function expectedClaudeContent(agentsRelPath) {
  return agentsRelPath === 'AGENTS.md' ? ROOT_CLAUDE_MD : NESTED_CLAUDE_MD;
}

function siblingClaudePath(agentsRelPath) {
  return agentsRelPath.replace(/AGENTS\.md$/, 'CLAUDE.md');
}

function siblingAgentsPath(claudeRelPath) {
  return claudeRelPath.replace(/CLAUDE\.md$/, 'AGENTS.md');
}

function isManagedClaudeMd(claudeAbsPath) {
  return (
    fs.existsSync(claudeAbsPath) && fs.readFileSync(claudeAbsPath, 'utf8').includes(MANAGED_MARKER)
  );
}

function removeFileAndEmptyParents(root, fileAbsPath) {
  fs.rmSync(fileAbsPath, { force: true });

  let currentDir = path.dirname(fileAbsPath);

  while (currentDir !== root && currentDir.startsWith(root + path.sep)) {
    const entries = fs.readdirSync(currentDir);

    if (entries.length > 0) {
      break;
    }

    fs.rmdirSync(currentDir);
    currentDir = path.dirname(currentDir);
  }
}

/**
 * Query git ignore semantics while retaining the deciding source and pattern.
 * @param root Repository root.
 * @param relPath Relative path to query.
 * @returns Ignore decision.
 */
function queryGitIgnoreDecision(root, relPath) {
  const result = spawnSync('git', ['check-ignore', '--verbose', '--stdin', '-z', '--no-index'], {
    cwd: root,
    input: `${relPath}\0`,
    encoding: 'utf8',
  });

  if (result.error) {
    return { kind: 'error', message: result.error.message };
  }

  if (result.status !== 0 && result.status !== 1) {
    return {
      kind: 'error',
      message:
        (result.stderr && result.stderr.trim()) ||
        `git check-ignore exited with status ${result.status}`,
    };
  }

  const [source, lineNumber, pattern] = result.stdout.split('\0');

  if (!pattern) {
    return { kind: 'none' };
  }

  return {
    kind: pattern.startsWith('!') ? 'unignored' : 'ignored',
    source,
    lineNumber,
    pattern,
  };
}

/**
 * Check and optionally repair managed CLAUDE.md adapters.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Adapter validation result.
 */
export function checkClaudeMdAdapters(root, fix) {
  const agentsMdPaths = findAgentsMd(root);
  const claudeMdPaths = findClaudeMd(root);
  const errors = [];
  const fixes = [];

  for (const agentsRelPath of agentsMdPaths) {
    const claudeRelPath = siblingClaudePath(agentsRelPath);
    const claudeAbsPath = path.join(root, claudeRelPath);
    const expected = expectedClaudeContent(agentsRelPath);

    if (!fs.existsSync(claudeAbsPath)) {
      if (fix) {
        fs.mkdirSync(path.dirname(claudeAbsPath), { recursive: true });
        fs.writeFileSync(claudeAbsPath, expected, 'utf8');
        fixes.push(`created ${claudeRelPath}`);
      } else {
        errors.push(
          `Missing managed adapter: ${claudeRelPath} (run \`pnpm verify --fix-only\` with the original task scope to create it)`,
        );
      }
      continue;
    }

    const existing = fs.readFileSync(claudeAbsPath, 'utf8');

    if (!existing.includes(MANAGED_MARKER)) {
      errors.push(
        `Unmanaged ${claudeRelPath} exists without the managed marker — manual file, not overwriting. ` +
          `Add ${MANAGED_MARKER} on the first line to allow automatic management, or keep it manual and ensure it imports AGENTS.md.`,
      );
      continue;
    }

    if (existing !== expected) {
      if (fix) {
        fs.writeFileSync(claudeAbsPath, expected, 'utf8');
        fixes.push(`updated ${claudeRelPath}`);
      } else {
        errors.push(
          `Stale managed adapter: ${claudeRelPath} content differs from expected (run \`pnpm verify --fix-only\` with the original task scope to update it)`,
        );
      }
    }
  }

  for (const claudeRelPath of claudeMdPaths) {
    const claudeAbsPath = path.join(root, claudeRelPath);

    if (!isManagedClaudeMd(claudeAbsPath)) {
      continue;
    }

    const agentsRelPath = siblingAgentsPath(claudeRelPath);

    if (fs.existsSync(path.join(root, agentsRelPath))) {
      continue;
    }

    if (fix) {
      removeFileAndEmptyParents(root, claudeAbsPath);
      fixes.push(`deleted orphan ${claudeRelPath}`);
    } else {
      errors.push(
        `Orphan managed adapter: ${claudeRelPath} has no sibling ${agentsRelPath} (run \`pnpm verify --fix-only\` with the original task scope to delete it)`,
      );
    }
  }

  return { errors, fixes };
}

/**
 * Check and optionally repair the .claude/skills compatibility symlink.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Symlink validation result.
 */
export function checkSkillsSymlink(root, fix) {
  const agentsSkillsAbs = path.join(root, '.agents', 'skills');
  const claudeSkillsAbs = path.join(root, '.claude', 'skills');
  const expectedLinkTarget = path.join('..', '.agents', 'skills');
  const errors = [];
  const fixes = [];

  if (!fs.existsSync(agentsSkillsAbs)) {
    return { errors, fixes };
  }

  let stat = null;

  try {
    stat = fs.lstatSync(claudeSkillsAbs);
  } catch {
    // Missing path is handled below.
  }

  if (stat === null) {
    if (fix) {
      fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
      fs.symlinkSync(
        expectedLinkTarget,
        claudeSkillsAbs,
        getDirectorySymlinkType(process.platform),
      );
      fixes.push(`created .claude/skills -> ${expectedLinkTarget}`);
    } else {
      errors.push(
        `.agents/skills exists but .claude/skills symlink is missing (run \`pnpm verify --fix-only\` with the original task scope to create it)`,
      );
    }
    return { errors, fixes };
  }

  if (!stat.isSymbolicLink()) {
    errors.push(
      `.claude/skills is a real directory or file, not a symlink. ` +
        `Remove it manually and run \`pnpm verify --fix-only\` with the original task scope to create the correct symlink.`,
    );
    return { errors, fixes };
  }

  const actualTarget = fs.readlinkSync(claudeSkillsAbs);

  if (actualTarget !== expectedLinkTarget) {
    errors.push(
      `.claude/skills symlink points to '${actualTarget}' but expected '${expectedLinkTarget}'. ` +
        `Remove it manually and run \`pnpm verify --fix-only\` with the original task scope to recreate it.`,
    );
  }

  return { errors, fixes };
}

export function getDirectorySymlinkType(platform) {
  return platform === 'win32' ? 'junction' : undefined;
}

/**
 * Validate repository-owned ignore rules for managed Claude compatibility state.
 * @param root Repository root.
 * @returns Gitignore validation result.
 */
export function checkGitignoreCompatibility(root) {
  const errors = [];
  const skillsDecision = queryGitIgnoreDecision(root, '.claude/skills');

  if (skillsDecision.kind === 'error') {
    errors.push(
      `Unable to validate .gitignore compatibility with git check-ignore for .claude/skills: ${skillsDecision.message}. Fix the repository git setup and rerun pnpm verify.`,
    );
  } else if (skillsDecision.kind === 'ignored') {
    errors.push(
      `.claude/skills must not be ignored by git, but ${skillsDecision.source}:${skillsDecision.lineNumber} ('${skillsDecision.pattern}') ignores it. Update .gitignore so the managed compatibility symlink stays visible, then rerun the scoped \`pnpm verify --fix-only\` command if adapters or links need repair.`,
    );
  }

  const settingsPath = '.claude/settings.local.json';
  const settingsDecision = queryGitIgnoreDecision(root, settingsPath);

  if (settingsDecision.kind === 'error') {
    errors.push(
      `Unable to validate .gitignore compatibility with git check-ignore for ${settingsPath}: ${settingsDecision.message}. Fix the repository git setup and rerun pnpm verify.`,
    );
  } else if (settingsDecision.kind !== 'ignored' || settingsDecision.source !== '.gitignore') {
    let detail;

    if (settingsDecision.kind === 'none') {
      detail = 'no ignore rule matches it';
    } else if (settingsDecision.kind === 'unignored') {
      detail = `a negated rule at ${settingsDecision.source}:${settingsDecision.lineNumber} ('${settingsDecision.pattern}') un-ignores it`;
    } else {
      detail = `the deciding rule comes from ${settingsDecision.source}:${settingsDecision.lineNumber} ('${settingsDecision.pattern}'), not the repository .gitignore`;
    }

    errors.push(
      `${settingsPath} must be protected by a positive rule in the repository root .gitignore, but ${detail}. Update .gitignore so local Claude state stays untracked; \`pnpm verify --fix-only\` will not change .gitignore for you.`,
    );
  }

  return { errors, fixes: [] };
}

/**
 * Run all agent environment checks and optional safe repairs.
 * @param root Repository root.
 * @param fix Whether to apply safe repairs.
 * @returns Combined validation result.
 */
export function checkAgentEnvironment(root, fix) {
  const claudeResult = checkClaudeMdAdapters(root, fix);
  const skillsResult = checkSkillsSymlink(root, fix);
  const skillFrontmatterResult = checkSkillFrontmatter(root);
  const materialWorkflowGuidanceResult = checkMaterialWorkflowGuidance(root);
  const gitignoreResult = checkGitignoreCompatibility(root);

  return {
    errors: [
      ...claudeResult.errors,
      ...skillsResult.errors,
      ...skillFrontmatterResult.errors,
      ...materialWorkflowGuidanceResult.errors,
      ...gitignoreResult.errors,
    ],
    fixes: [
      ...claudeResult.fixes,
      ...skillsResult.fixes,
      ...skillFrontmatterResult.fixes,
      ...materialWorkflowGuidanceResult.fixes,
      ...gitignoreResult.fixes,
    ],
  };
}

function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const check = args.includes('--check');
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

  if (!fix && !check) {
    console.error('Usage: node scripts/agentEnvironment.mjs --check | --fix');
    process.exit(1);
  }

  const { errors, fixes } = checkAgentEnvironment(root, fix);

  for (const message of fixes) {
    console.log(`[agent-environment] fixed: ${message}`);
  }

  for (const message of errors) {
    console.error(`[agent-environment] error: ${message}`);
  }

  if (errors.length > 0) {
    process.exit(1);
  }

  if (fixes.length === 0 && fix) {
    console.log('[agent-environment] nothing to fix');
  }

  if (check) {
    console.log('[agent-environment] ok');
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
