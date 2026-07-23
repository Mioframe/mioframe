import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkAgentEnvironment, getDirectorySymlinkType } from './agentEnvironment.mjs';

const VALID_GITIGNORE =
  '.claude/*\n!.claude/skills\n!.claude/skills/**\n.claude/settings.local.json\n';

const MANAGED_ROOT_CLAUDE = `<!-- managed:agent-compat -->

@AGENTS.md

## Claude Code compatibility

This repository uses AGENTS.md as the canonical agent instruction format.

Do not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\*/SKILL.md instead.
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

  const excludesPath = path.join(root, '.git', 'test-global-excludes');
  fs.writeFileSync(excludesPath, '', 'utf8');
  const configResult = spawnSync('git', ['config', 'core.excludesFile', excludesPath], {
    cwd: root,
    encoding: 'utf8',
  });
  if (configResult.status !== 0) {
    throw new Error(configResult.stderr || 'git config failed');
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

let tempRoot;

beforeEach(() => {
  tempRoot = null;
});

afterEach(() => {
  if (tempRoot) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
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
      expect.stringContaining('.claude/settings.local.json must remain ignored'),
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
