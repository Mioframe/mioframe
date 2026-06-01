import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { checkAgentEnvironment } from './agentEnvironment.mjs';

/**
 * Create a minimal temp repo with the given files.
 * @param files
 */
function makeTempRepo(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-env-test-'));

  for (const [rel, content] of Object.entries(files)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });

    if (content === null) {
      // Create a directory.
      fs.mkdirSync(abs, { recursive: true });
    } else {
      fs.writeFileSync(abs, content, 'utf8');
    }
  }

  return root;
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
    tempRoot = makeTempRepo({ 'AGENTS.md': '# Root' });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('CLAUDE.md');
    expect(result.errors[0]).toContain('pnpm verify --fix');
  });

  it('fails when nested CLAUDE.md is missing', () => {
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': '<!-- managed:agent-compat -->\n\n@AGENTS.md\n',
      'src/foo/AGENTS.md': '# Foo',
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors.some((e) => e.includes('src/foo/CLAUDE.md'))).toBe(true);
  });

  it('fails when managed adapter is stale', () => {
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': '<!-- managed:agent-compat -->\nold content\n',
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors.some((e) => e.includes('CLAUDE.md') && e.includes('Stale'))).toBe(true);
  });

  it('fails for unmanaged CLAUDE.md without overwriting it', () => {
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': '# My custom Claude rules\n',
    });
    const result = checkAgentEnvironment(tempRoot, false);
    const content = fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8');

    expect(result.errors.some((e) => e.includes('Unmanaged'))).toBe(true);
    expect(content).toBe('# My custom Claude rules\n');
  });

  it('passes when all adapters are correct', () => {
    const rootContent =
      '<!-- managed:agent-compat -->\n\n@AGENTS.md\n\n## Claude Code compatibility\n\nThis repository uses AGENTS.md as the canonical agent instruction format.\n\nDo not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\*/SKILL.md instead.\n';
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': rootContent,
    });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors).toHaveLength(0);
  });
});

describe('CLAUDE.md adapters — fix mode', () => {
  it('creates missing root CLAUDE.md', () => {
    tempRoot = makeTempRepo({ 'AGENTS.md': '# Root' });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.fixes.some((f) => f.includes('CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tempRoot, 'CLAUDE.md'))).toBe(true);
  });

  it('creates missing nested CLAUDE.md', () => {
    const rootContent =
      '<!-- managed:agent-compat -->\n\n@AGENTS.md\n\n## Claude Code compatibility\n\nThis repository uses AGENTS.md as the canonical agent instruction format.\n\nDo not duplicate project policy in CLAUDE.md. Update AGENTS.md, nested AGENTS.md, or .agents/skills/\\*/SKILL.md instead.\n';
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': rootContent,
      'src/foo/AGENTS.md': '# Foo',
    });
    checkAgentEnvironment(tempRoot, true);

    expect(fs.existsSync(path.join(tempRoot, 'src/foo/CLAUDE.md'))).toBe(true);
  });

  it('updates stale managed adapter', () => {
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': '<!-- managed:agent-compat -->\nold content\n',
    });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.fixes.some((f) => f.includes('CLAUDE.md'))).toBe(true);
  });

  it('does not overwrite unmanaged CLAUDE.md', () => {
    tempRoot = makeTempRepo({
      'AGENTS.md': '# Root',
      'CLAUDE.md': '# My custom rules\n',
    });
    checkAgentEnvironment(tempRoot, true);
    const content = fs.readFileSync(path.join(tempRoot, 'CLAUDE.md'), 'utf8');

    expect(content).toBe('# My custom rules\n');
  });
});

describe('.claude/skills symlink — check mode', () => {
  it('fails when .agents/skills exists but .claude/skills is missing', () => {
    tempRoot = makeTempRepo({ '.agents/skills': null });
    const result = checkAgentEnvironment(tempRoot, false);

    expect(result.errors.some((e) => e.includes('.claude/skills') && e.includes('missing'))).toBe(
      true,
    );
  });

  it('fails when .claude/skills points to wrong target', () => {
    tempRoot = makeTempRepo({ '.agents/skills': null });
    const claudeDir = path.join(tempRoot, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync('../other/path', path.join(claudeDir, 'skills'));
    const result = checkAgentEnvironment(tempRoot, false);

    expect(
      result.errors.some((e) => e.includes('.claude/skills') && e.includes('../other/path')),
    ).toBe(true);
  });
});

describe('.claude/skills symlink — fix mode', () => {
  it('creates symlink when .agents/skills exists', () => {
    tempRoot = makeTempRepo({ '.agents/skills': null });
    checkAgentEnvironment(tempRoot, true);
    const linkPath = path.join(tempRoot, '.claude', 'skills');
    const target = fs.readlinkSync(linkPath);

    expect(target).toBe(path.join('..', '.agents', 'skills'));
  });

  it('reports error when .claude/skills is a real directory', () => {
    tempRoot = makeTempRepo({ '.agents/skills': null, '.claude/skills': null });
    const result = checkAgentEnvironment(tempRoot, true);

    expect(result.errors.some((e) => e.includes('real directory'))).toBe(true);
  });
});

describe('.gitignore rules', () => {
  it('allows .claude/skills while ignoring local Claude state', () => {
    const gitignorePath = path.resolve(
      path.dirname(new URL(import.meta.url).pathname),
      '../.gitignore',
    );
    const content = fs.readFileSync(gitignorePath, 'utf8');

    expect(content).toContain('.claude/*');
    expect(content).toContain('!.claude/skills');
    expect(content).toContain('.claude/settings.local.json');
  });
});
