import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  checkAgentEnvironment,
  checkMaterialArtifactTimestamps,
  checkSingleMaterialArtifact,
  getDirectorySymlinkType,
  validateMaterialArtifactContent,
} from './agentEnvironment.mjs';

const VALID_GITIGNORE =
  '.claude/*\n!.claude/skills\n!.claude/skills/**\n.claude/settings.local.json\n';

const MANAGED_ROOT_CLAUDE = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or canonical skill files under .agents/skills instead.
`;

const MANAGED_NESTED_CLAUDE = `<!-- managed:agent-compat -->

@AGENTS.md
`;

/**
 * Create a minimal temp repo with the given files.
 * @param files Relative file map for the temp repository.
 * @returns Absolute temp repository path.
 */
function makeTempRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-env-test-'));

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });

    if (content === null) {
      fs.mkdirSync(abs, { recursive: true });
    } else {
      fs.writeFileSync(abs, content, 'utf8');
    }
  }

  initializeGitRepo(root);
  return root;
}

/**
 * Initialize a Git repo so git check-ignore behaves like production.
 * @param root Absolute temp repository path.
 */
function initializeGitRepo(root) {
  const initResult = spawnSync('git', ['init'], {
    cwd: root,
    encoding: 'utf8',
  });

  if (initResult.status !== 0) {
    throw new Error(initResult.stderr || 'git init failed');
  }
}

/**
 * Write a symlink.
 * @param root Absolute temp repository path.
 * @param relPath Relative symlink location.
 * @param target Symlink target string.
 */
function makeSymlink(root, relPath, target) {
  const absPath = path.join(root, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.symlinkSync(target, absPath);
}

/**
 * Create a temp ignore file outside the repository and configure it as the
 * repository-local core.excludesFile, so tests can reproduce an external
 * ignore source without touching real user-level or system-level git config.
 * @param root Absolute temp repository path.
 * @param patterns Ignore file contents.
 * @returns Absolute path to the temp directory holding the excludes file, for cleanup.
 */
function configureExternalExcludesFile(root, patterns) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-env-excludes-'));
  const excludesPath = path.join(dir, 'excludes');
  fs.writeFileSync(excludesPath, patterns, 'utf8');

  const result = spawnSync('git', ['config', 'core.excludesFile', excludesPath], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || 'git config core.excludesFile failed');
  }

  return dir;
}

/**
 * Append ignore patterns to the repository-local .git/info/exclude file.
 * @param root Absolute temp repository path.
 * @param patterns Ignore file contents to append.
 */
function appendInfoExclude(root, patterns) {
  fs.appendFileSync(path.join(root, '.git', 'info', 'exclude'), patterns);
}

/**
 * Ask raw git whether it considers a path ignored, using the same query
 * shape production check-ignore commands use (index-independent).
 * @param root Absolute temp repository path.
 * @param relPath Relative path to test.
 * @returns True when raw git reports the path as ignored.
 */
function isRawGitIgnored(root, relPath) {
  const result = spawnSync('git', ['check-ignore', '-q', '--no-index', relPath], {
    cwd: root,
  });

  return result.status === 0;
}

let tempRoot;
let externalExcludeDirs;

beforeEach(() => {
  tempRoot = null;
  externalExcludeDirs = [];
});

afterEach(() => {
  if (tempRoot) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  for (const dir of externalExcludeDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('CLAUDE.md adapters — check mode', () => {
  it('fails when root CLAUDE.md is missing', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('Missing managed adapter: CLAUDE.md'),
    );
  });

  it('fails when nested CLAUDE.md is missing', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
      'src/foo/AGENTS.md': '# Foo',
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('Missing managed adapter: src/foo/CLAUDE.md'),
    );
  });

  it('fails when managed adapter is stale', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': '<!-- managed:agent-compat -->\nold content\n',
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(expect.stringContaining('Stale managed adapter'));
  });

  it('fails for unmanaged CLAUDE.md without overwriting it', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': '# My custom Claude rules\n',
    });
    const result = checkAgentEnvironment(tempRoot, false);
    const content = fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8');

    expect(result.errors).toContainEqual(expect.stringContaining('Unmanaged CLAUDE.md exists'));
    expect(content).toBe('# My custom Claude rules\n');
  });

  it('fails when a managed CLAUDE.md is orphaned', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(expect.stringContaining('Orphan managed adapter'));
  });

  it('passes when all adapters are correct', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
      'src/foo/AGENTS.md': '# Foo',
      'src/foo/CLAUDE.md': MANAGED_NESTED_CLAUDE,
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(0);
  });
});

describe('CLAUDE.md adapters — fix mode', () => {
  it('creates missing root CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
    });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.fixes).toContainEqual(expect.stringContaining('created CLAUDE.md'));
    expect(fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8')).toBe(MANAGED_ROOT_CLAUDE);
  });

  it('creates missing nested CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
      'src/foo/AGENTS.md': '# Foo',
    });

    checkAgentEnvironment(tempRoot, true);

    expect(fs.readFileSync(path.join(tempRoot, 'src/foo/CLAUDE.md'), 'utf8')).toBe(
      MANAGED_NESTED_CLAUDE,
    );
  });

  it('updates stale managed adapter', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': '<!-- managed:agent-compat -->\nold content\n',
    });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.fixes).toContainEqual(expect.stringContaining('updated CLAUDE.md'));
    expect(fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8')).toBe(MANAGED_ROOT_CLAUDE);
  });

  it('deletes orphan managed CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
    });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.fixes).toContainEqual(expect.stringContaining('deleted orphan CLAUDE.md'));
    expect(fs.existsSync(path.join(tempRoot, 'CLAUDE.md'))).toBe(false);
  });

  it('preserves unmanaged orphan CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'CLAUDE.md': '# Local custom rules\n',
    });

    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.errors).toHaveLength(0);
    expect(fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8')).toBe(
      '# Local custom rules\n',
    );
  });

  it('does not overwrite unmanaged CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': '# My custom rules\n',
    });
    checkAgentEnvironment(tempRoot, true);
    const content = fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8');

    expect(content).toBe('# My custom rules\n');
  });
});

describe('.claude/skills symlink', () => {
  it('fails when .agents/skills exists but .claude/skills is missing', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      '.agents/skills': null,
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('.agents/skills exists but .claude/skills symlink is missing'),
    );
  });

  it('fails when .claude/skills points to wrong target', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      '.agents/skills': null,
    });
    makeSymlink(tempRoot, '.claude/skills', '../other/path');

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining(".claude/skills symlink points to '../other/path'"),
    );
  });

  it('creates the symlink in fix mode', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      '.agents/skills': null,
    });

    checkAgentEnvironment(tempRoot, true);

    expect(fs.readlinkSync(path.join(tempRoot, '.claude', 'skills'))).toBe(
      path.join('..', '.agents', 'skills'),
    );
  });

  it('reports an error when .claude/skills is a real directory', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      '.agents/skills': null,
      '.claude/skills': null,
    });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.errors).toContainEqual(expect.stringContaining('real directory or file'));
  });
});

describe('.gitignore validation', () => {
  it('passes when .claude/skills is unignored and local Claude state stays ignored', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
    });

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(0);
  });

  it('fails when .claude/skills is ignored by git', () => {
    tempRoot = makeTempRepo({
      '.gitignore': '.claude/\n',
    });

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('.claude/skills must not be ignored'),
    );
  });

  it('fails when local Claude state is no longer ignored', () => {
    tempRoot = makeTempRepo({
      '.gitignore': '',
    });

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining(
        '.claude/settings.local.json must be protected by a positive rule in the repository root .gitignore',
      ),
    );
  });

  it('fails when only an external core.excludesFile protects settings.local.json, reproducing the nondeterministic failure', () => {
    tempRoot = makeTempRepo({
      '.gitignore': '',
    });
    externalExcludeDirs.push(
      configureExternalExcludesFile(tempRoot, '.claude/settings.local.json\n'),
    );

    expect(isRawGitIgnored(tempRoot, '.claude/settings.local.json')).toBe(true);

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining(
        '.claude/settings.local.json must be protected by a positive rule in the repository root .gitignore',
      ),
    );
  });

  it('passes with a valid repository .gitignore even when an external ignore file also matches', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
    });
    externalExcludeDirs.push(
      configureExternalExcludesFile(tempRoot, '.claude/settings.local.json\n'),
    );

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(0);
  });

  it('fails when settings.local.json is matched only by .git/info/exclude', () => {
    tempRoot = makeTempRepo({
      '.gitignore': '',
    });
    appendInfoExclude(tempRoot, '.claude/settings.local.json\n');

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining(
        '.claude/settings.local.json must be protected by a positive rule in the repository root .gitignore',
      ),
    );
  });

  it('fails when .claude/skills is ignored only by an external rule with no repository override', () => {
    tempRoot = makeTempRepo({
      '.gitignore': '.claude/settings.local.json\n',
    });
    externalExcludeDirs.push(configureExternalExcludesFile(tempRoot, '.claude/skills\n'));

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('.claude/skills must not be ignored'),
    );
  });

  it('reports a git operational failure as an explicit validation error', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
    });
    const missingRoot = path.join(tempRoot, 'does-not-exist');

    const result = checkAgentEnvironment(missingRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining('Unable to validate .gitignore compatibility'),
    );
  });
});

describe('directory symlink type', () => {
  it('uses junction for Windows directory symlinks', () => {
    expect(getDirectorySymlinkType('win32')).toBe('junction');
  });

  it('leaves the symlink type unspecified outside Windows', () => {
    expect(getDirectorySymlinkType('linux')).toBeUndefined();
  });
});

describe('ignored traversal directories', () => {
  it('does not generate adapters from ignored local directories', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      '.opencode/AGENTS.md': '# ignored',
      '.sisyphus/AGENTS.md': '# ignored',
      '.claude/AGENTS.md': '# ignored',
      'dist-ssr/AGENTS.md': '# ignored',
    });

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(0);
    expect(fs.existsSync(path.join(tempRoot, '.opencode', 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, '.sisyphus', 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, '.claude', 'CLAUDE.md'))).toBe(false);
    expect(fs.existsSync(path.join(tempRoot, 'dist-ssr', 'CLAUDE.md'))).toBe(false);
  });
});

describe('Material workflow artifact timestamps — validateMaterialArtifactContent', () => {
  const REVIEW_PATH = 'src/shared/ui/material/components/widget/REVIEW.md';
  const DESIGN_PATH = 'src/shared/ui/material/components/widget/DESIGN.md';
  const FIXED_NOW_MS = Date.parse('2026-08-13T10:00:00.000Z');

  it('passes a past valid Artifact revision', () => {
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toHaveLength(0);
  });

  it('passes a revision exactly equal to the injected current instant', () => {
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13T10:00:00.000Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toHaveLength(0);
  });

  it('fails a revision one millisecond in the future', () => {
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13T10:00:00.001Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toContainEqual(expect.stringContaining('is in the future'));
  });

  it('fails a malformed timestamp', () => {
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13 10:00:00\n',
      FIXED_NOW_MS,
    );

    expect(errors).toContainEqual(expect.stringContaining('not exact UTC ISO format'));
  });

  it('fails a local-looking timestamp incorrectly suffixed with Z that is therefore future', () => {
    // Reproduces the actual regression: a worker misread local wall-clock
    // time (11:00) as UTC while actual UTC was 08:00.
    const actualUtcNowMs = Date.parse('2026-08-13T08:00:00.000Z');
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13T11:00:00.000Z\n',
      actualUtcNowMs,
    );

    expect(errors).toContainEqual(expect.stringContaining('is in the future'));
  });

  it('fails a missing Artifact revision field', () => {
    const errors = validateMaterialArtifactContent(REVIEW_PATH, '# Review\n', FIXED_NOW_MS);

    expect(errors).toContainEqual(expect.stringContaining("missing required 'Artifact revision'"));
  });

  it('fails a duplicate Artifact revision field', () => {
    const errors = validateMaterialArtifactContent(
      REVIEW_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\nArtifact revision: 2026-08-13T09:30:00.000Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toContainEqual(expect.stringContaining("duplicate 'Artifact revision'"));
  });

  it('passes a valid DESIGN.md Design contract revision', () => {
    const errors = validateMaterialArtifactContent(
      DESIGN_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\nDesign contract revision: 2026-08-12T09:00:00.000Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toHaveLength(0);
  });

  it('fails a future DESIGN.md Design contract revision', () => {
    const errors = validateMaterialArtifactContent(
      DESIGN_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\nDesign contract revision: 2026-08-13T10:00:00.001Z\n',
      FIXED_NOW_MS,
    );

    expect(errors).toContainEqual(
      expect.stringContaining(
        "'Design contract revision' value '2026-08-13T10:00:00.001Z' is in the future",
      ),
    );
  });

  it('fails a future Source checked at date', () => {
    const errors = validateMaterialArtifactContent(
      DESIGN_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\nDesign contract revision: 2026-08-13T09:00:00.000Z\nSource checked at: 2026-08-14\n',
      FIXED_NOW_MS,
    );

    expect(errors).toContainEqual(
      expect.stringContaining(
        "'Source checked at' value '2026-08-14' is later than the current UTC calendar date",
      ),
    );
  });

  it('allows a future Refresh check after date', () => {
    const errors = validateMaterialArtifactContent(
      DESIGN_PATH,
      'Artifact revision: 2026-08-13T09:00:00.000Z\nDesign contract revision: 2026-08-13T09:00:00.000Z\nSource checked at: 2026-08-13\nRefresh check after: 2099-01-01\n',
      FIXED_NOW_MS,
    );

    expect(errors).toHaveLength(0);
  });
});

describe('Material workflow artifact timestamps — checkSingleMaterialArtifact', () => {
  it('rejects a non-canonical artifact path', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'README.md': '# Not a Material artifact\n',
    });

    const result = checkSingleMaterialArtifact(tempRoot, 'README.md', Date.now());

    expect(result.errors).toContainEqual(
      expect.stringContaining('is not a canonical Material workflow artifact path'),
    );
  });

  it('rejects a Markdown file outside the five canonical stage names', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'src/shared/ui/material/components/widget/NOTES.md': '# Notes\n',
    });

    const result = checkSingleMaterialArtifact(
      tempRoot,
      'src/shared/ui/material/components/widget/NOTES.md',
      Date.now(),
    );

    expect(result.errors).toContainEqual(
      expect.stringContaining('is not a canonical Material workflow artifact path'),
    );
  });

  it('validates a single canonical artifact using the same production rules', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'src/shared/ui/material/components/widget/REVIEW.md':
        'Artifact revision: 2099-01-01T00:00:00.000Z\n',
    });

    const result = checkSingleMaterialArtifact(
      tempRoot,
      'src/shared/ui/material/components/widget/REVIEW.md',
      Date.parse('2026-08-13T10:00:00.000Z'),
    );

    expect(result.errors).toContainEqual(expect.stringContaining('is in the future'));
  });
});

describe('Material workflow artifact timestamps — repository-wide scan', () => {
  it('finds no artifacts when no component families exist', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
    });

    const result = checkMaterialArtifactTimestamps(tempRoot, Date.now());

    expect(result.errors).toHaveLength(0);
    expect(result.fixes).toHaveLength(0);
  });

  it('does not scan arbitrary Markdown files outside the canonical five stage names', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'src/shared/ui/material/components/widget/NOTES.md':
        '# not canonical, no Artifact revision\n',
    });

    const result = checkMaterialArtifactTimestamps(tempRoot, Date.now());

    expect(result.errors).toHaveLength(0);
  });
});

describe('Material workflow artifact timestamps — checkAgentEnvironment wiring', () => {
  it('includes Material artifact failures in the normal check', () => {
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
      'src/shared/ui/material/components/widget/REVIEW.md': '# Review with no Artifact revision\n',
    });

    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toContainEqual(
      expect.stringContaining(
        "src/shared/ui/material/components/widget/REVIEW.md is missing required 'Artifact revision'",
      ),
    );
  });

  it('does not rewrite an invalid Material artifact in --fix mode', () => {
    const invalidContent = '# Review with no Artifact revision\n';
    tempRoot = makeTempRepo({
      '.gitignore': VALID_GITIGNORE,
      'AGENTS.md': '# Root',
      'CLAUDE.md': MANAGED_ROOT_CLAUDE,
      'src/shared/ui/material/components/widget/REVIEW.md': invalidContent,
    });

    const result = checkAgentEnvironment(tempRoot, true);
    const contentAfterFix = fs.readFileSync(
      path.join(tempRoot, 'src/shared/ui/material/components/widget/REVIEW.md'),
      'utf8',
    );

    expect(contentAfterFix).toBe(invalidContent);
    expect(result.fixes.some((message) => message.includes('REVIEW.md'))).toBe(false);
    expect(result.errors).toContainEqual(
      expect.stringContaining(
        "src/shared/ui/material/components/widget/REVIEW.md is missing required 'Artifact revision'",
      ),
    );
  });
});

describe('repo test fixture sanity', () => {
  it('reads the repository .gitignore using fileURLToPath-safe path resolution', () => {
    const gitignorePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../.gitignore',
    );
    const content = fs.readFileSync(gitignorePath, 'utf8');

    expect(content).toContain('.claude/*');
  });
});
