/**
 * Agent environment compatibility check/fix script.
 *
 * Ensures Claude Code can load project rules and skills that are canonically
 * defined in AGENTS.md files and .agents/skills.
 *
 * Usage:
 *   node scripts/agentEnvironment.mjs --check
 *   node scripts/agentEnvironment.mjs --fix
 */

import fs from 'node:fs';
import path from 'node:path';

const MANAGED_MARKER = '<!-- managed:agent-compat -->';

const ROOT_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\*/SKILL.md instead.
`;

const NESTED_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md
`;

/** Directories to skip entirely during traversal. */
const IGNORED_DIRS = new Set([
  'node_modules',
  'dist',
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
]);

/**
 * Find all AGENTS.md files under the given root, skipping ignored directories.
 * @param root Absolute path to the repository root.
 * @returns Relative posix paths to AGENTS.md files.
 */
function findAgentsMd(root) {
  const results = [];

  function visit(dir) {
    let entries;

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(path.join(dir, entry.name));
        }
      } else if (entry.isFile() && entry.name === 'AGENTS.md') {
        const rel = path.relative(root, path.join(dir, entry.name));
        results.push(rel.split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results;
}

/**
 * Return expected CLAUDE.md content for a given AGENTS.md relative path.
 * @param agentsRelPath Relative posix path like "AGENTS.md" or "src/foo/AGENTS.md".
 * @returns
 */
function expectedClaudeContent(agentsRelPath) {
  return agentsRelPath === 'AGENTS.md' ? ROOT_CLAUDE_MD : NESTED_CLAUDE_MD;
}

/**
 * Derive the sibling CLAUDE.md path from an AGENTS.md path.
 * @param agentsRelPath
 * @returns
 */
function siblingClaudePath(agentsRelPath) {
  return agentsRelPath.replace(/AGENTS\.md$/, 'CLAUDE.md');
}

/**
 * Check and optionally fix all CLAUDE.md adapters.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns
 */
export function checkClaudeMdAdapters(root, fix) {
  const agentsMdPaths = findAgentsMd(root);
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
          `Missing managed adapter: ${claudeRelPath} (run pnpm verify --fix to create it)`,
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
          `Stale managed adapter: ${claudeRelPath} content differs from expected (run pnpm verify --fix to update it)`,
        );
      }
    }
  }

  return { errors, fixes };
}

/**
 * Check and optionally fix the .claude/skills symlink.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns
 */
export function checkSkillsSymlink(root, fix) {
  const agentsSkillsAbs = path.join(root, '.agents', 'skills');
  const claudeSkillsAbs = path.join(root, '.claude', 'skills');
  const expectedLinkTarget = path.join('..', '.agents', 'skills');
  const errors = [];
  const fixes = [];

  if (!fs.existsSync(agentsSkillsAbs)) {
    // No canonical skills directory — nothing to check.
    return { errors, fixes };
  }

  // Use lstatSync (does not follow symlinks) to detect all link states.
  let stat = null;

  try {
    stat = fs.lstatSync(claudeSkillsAbs);
  } catch {
    // Entry does not exist at all.
  }

  if (stat === null) {
    if (fix) {
      fs.mkdirSync(path.join(root, '.claude'), { recursive: true });
      fs.symlinkSync(expectedLinkTarget, claudeSkillsAbs);
      fixes.push(`created .claude/skills -> ${expectedLinkTarget}`);
    } else {
      errors.push(
        `.agents/skills exists but .claude/skills symlink is missing (run pnpm verify --fix to create it)`,
      );
    }

    return { errors, fixes };
  }

  if (!stat.isSymbolicLink()) {
    errors.push(
      `.claude/skills is a real directory or file, not a symlink. ` +
        `Remove it manually and run pnpm verify --fix to create the correct symlink.`,
    );
    return { errors, fixes };
  }

  const actualTarget = fs.readlinkSync(claudeSkillsAbs);

  if (actualTarget !== expectedLinkTarget) {
    errors.push(
      `.claude/skills symlink points to '${actualTarget}' but expected '${expectedLinkTarget}'. ` +
        `Remove it manually and run pnpm verify --fix to recreate.`,
    );
  }

  return { errors, fixes };
}

/**
 * Run all agent-environment checks/fixes.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns
 */
export function checkAgentEnvironment(root, fix) {
  const claudeResult = checkClaudeMdAdapters(root, fix);
  const skillsResult = checkSkillsSymlink(root, fix);

  return {
    errors: [...claudeResult.errors, ...skillsResult.errors],
    fixes: [...claudeResult.fixes, ...skillsResult.fixes],
  };
}

/**
 * Main entry point.
 */
function main() {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  const check = args.includes('--check');

  if (!fix && !check) {
    console.error('Usage: node scripts/agentEnvironment.mjs --check | --fix');
    process.exit(1);
  }

  const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

  const { errors: allErrors, fixes: allFixes } = checkAgentEnvironment(root, fix);

  for (const msg of allFixes) {
    console.log(`[agent-environment] fixed: ${msg}`);
  }

  for (const msg of allErrors) {
    console.error(`[agent-environment] error: ${msg}`);
  }

  if (allErrors.length > 0) {
    process.exit(1);
  }

  if (allFixes.length === 0 && fix) {
    console.log('[agent-environment] nothing to fix');
  }

  if (check && allErrors.length === 0) {
    console.log('[agent-environment] ok');
  }
}

import { fileURLToPath } from 'node:url';

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
