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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkAgentInstructionPolicy } from './agentInstructionPolicy.mjs';

const MANAGED_MARKER = '<!-- managed:agent-compat -->';

const ROOT_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/*/SKILL.md instead.
`;

const NESTED_CLAUDE_MD = `<!-- managed:agent-compat -->

@AGENTS.md
`;

/** Directories to skip entirely during traversal. */
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

/**
 * Find all matching files under the given root, skipping ignored directories.
 * @param root Absolute repository path.
 * @param fileName File name to match.
 * @returns Relative posix paths.
 */
function findNamedFiles(root, fileName) {
  const results = [];

  function visit(dir) {
    let entries;

    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          visit(entryPath);
        }
        continue;
      }

      if (entry.isFile() && entry.name === fileName) {
        const rel = path.relative(root, entryPath);
        results.push(rel.split(path.sep).join('/'));
      }
    }
  }

  visit(root);
  return results.sort((left, right) => left.localeCompare(right));
}

/**
 * Find all AGENTS.md files under the given root, skipping ignored directories.
 * @param root Absolute repository path.
 * @returns AGENTS.md paths relative to the repository root.
 */
function findAgentsMd(root) {
  return findNamedFiles(root, 'AGENTS.md');
}

/**
 * Find all CLAUDE.md files under the given root, skipping ignored directories.
 * @param root Absolute repository path.
 * @returns CLAUDE.md paths relative to the repository root.
 */
function findClaudeMd(root) {
  return findNamedFiles(root, 'CLAUDE.md');
}

/**
 * Return expected CLAUDE.md content for a given AGENTS.md relative path.
 * @param agentsRelPath Relative posix path like "AGENTS.md" or "src/foo/AGENTS.md".
 * @returns Managed CLAUDE.md content for that location.
 */
function expectedClaudeContent(agentsRelPath) {
  return agentsRelPath === 'AGENTS.md' ? ROOT_CLAUDE_MD : NESTED_CLAUDE_MD;
}

/**
 * Derive the sibling CLAUDE.md path from an AGENTS.md path.
 * @param agentsRelPath Relative AGENTS.md path.
 * @returns Relative sibling CLAUDE.md path.
 */
function siblingClaudePath(agentsRelPath) {
  return agentsRelPath.replace(/AGENTS\.md$/, 'CLAUDE.md');
}

/**
 * Derive the sibling AGENTS.md path from a CLAUDE.md path.
 * @param claudeRelPath Relative CLAUDE.md path.
 * @returns Relative sibling CLAUDE.md path.
 */
function siblingAgentsPath(claudeRelPath) {
  return claudeRelPath.replace(/CLAUDE\.md$/, 'AGENTS.md');
}

/**
 * Determine whether a CLAUDE.md file is managed by this script.
 * @param claudeAbsPath Absolute CLAUDE.md path.
 * @returns True when the file contains the managed marker.
 */
function isManagedClaudeMd(claudeAbsPath) {
  if (!fs.existsSync(claudeAbsPath)) {
    return false;
  }

  return fs.readFileSync(claudeAbsPath, 'utf8').includes(MANAGED_MARKER);
}

/**
 * Remove a file if it exists and then recursively remove now-empty parent dirs.
 * Stops before deleting the repository root.
 * @param root Absolute repository path.
 * @param fileAbsPath Absolute path to the file to remove.
 */
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
 * Check whether git ignores a path.
 * git check-ignore semantics:
 *   - exit code 0: ignored
 *   - exit code 1: not ignored
 *   - exit code >1: operational failure
 * @param root Absolute repository path.
 * @param relPath Relative path to test with git check-ignore.
 * @returns True when git ignores the path.
 */
function isIgnoredByGit(root, relPath) {
  const result = spawnSync('git', ['check-ignore', '-q', '--no-index', relPath], {
    cwd: root,
    stdio: 'ignore',
  });

  if (result.status === 0) {
    return true;
  }

  if (result.status === 1) {
    return false;
  }

  throw new Error(`git check-ignore failed for ${relPath}`);
}

/**
 * Check and optionally fix all CLAUDE.md adapters.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns Collected adapter errors and applied fixes.
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

  for (const claudeRelPath of claudeMdPaths) {
    const claudeAbsPath = path.join(root, claudeRelPath);

    if (!isManagedClaudeMd(claudeAbsPath)) {
      continue;
    }

    const agentsRelPath = siblingAgentsPath(claudeRelPath);
    const agentsAbsPath = path.join(root, agentsRelPath);

    if (fs.existsSync(agentsAbsPath)) {
      continue;
    }

    if (fix) {
      removeFileAndEmptyParents(root, claudeAbsPath);
      fixes.push(`deleted orphan ${claudeRelPath}`);
    } else {
      errors.push(
        `Orphan managed adapter: ${claudeRelPath} has no sibling ${agentsRelPath} (run pnpm verify --fix to delete it)`,
      );
    }
  }

  return { errors, fixes };
}

/**
 * Check and optionally fix the .claude/skills symlink.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns Collected symlink errors and applied fixes.
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
 * Select the symlink type for directory links on the current platform.
 * Windows directory symlinks should use `junction` for broad compatibility.
 * @param platform Node platform identifier.
 * @returns Symlink type to pass to fs.symlinkSync.
 */
export function getDirectorySymlinkType(platform) {
  return platform === 'win32' ? 'junction' : undefined;
}

/**
 * Validate .gitignore rules that affect managed compatibility files.
 * @param root Repository root.
 * @returns Collected .gitignore validation errors.
 */
export function checkGitignoreCompatibility(root) {
  const errors = [];

  try {
    if (isIgnoredByGit(root, '.claude/skills')) {
      errors.push(
        `.claude/skills must not be ignored by git. Update .gitignore so the managed compatibility symlink stays visible, then rerun pnpm verify --fix if adapters or links need repair.`,
      );
    }

    if (!isIgnoredByGit(root, '.claude/settings.local.json')) {
      errors.push(
        `.claude/settings.local.json must remain ignored by git. Update .gitignore so local Claude state stays untracked; pnpm verify --fix will not change .gitignore for you.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(
      `Unable to validate .gitignore compatibility with git check-ignore: ${message}. Fix the repository git setup and rerun pnpm verify.`,
    );
  }

  return { errors, fixes: [] };
}

/**
 * Run all agent-environment checks/fixes.
 * @param root Repository root.
 * @param fix Whether to apply fixes.
 * @returns Collected errors and applied fixes for the full agent environment.
 */
export function checkAgentEnvironment(root, fix) {
  const instructionResult = checkAgentInstructionPolicy(root, fix);
  const claudeResult = checkClaudeMdAdapters(root, fix);
  const skillsResult = checkSkillsSymlink(root, fix);
  const gitignoreResult = checkGitignoreCompatibility(root);

  return {
    errors: [
      ...instructionResult.errors,
      ...claudeResult.errors,
      ...skillsResult.errors,
      ...gitignoreResult.errors,
    ],
    fixes: [
      ...instructionResult.fixes,
      ...claudeResult.fixes,
      ...skillsResult.fixes,
      ...gitignoreResult.fixes,
    ],
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

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
