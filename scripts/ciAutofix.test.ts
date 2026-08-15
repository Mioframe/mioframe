import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { runAutofixIdempotencyCheck, snapshotWorkingTree } from './ciAutofix.ts';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function runGit(root: string, args: readonly string[]): void {
  const result = spawnSync('git', args, {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || `git ${args.join(' ')} failed`);
  }
}

function hasCachedAutofixOutput(root: string): boolean {
  runGit(root, ['add', '-A']);
  const result = spawnSync('git', ['diff', '--cached', '--quiet', '--exit-code'], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(result.stderr || 'git diff --cached --quiet --exit-code failed');
  }

  return result.status === 1;
}

function makeRepo(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ci-autofix-test-'));
  runGit(root, ['init']);
  runGit(root, ['config', 'user.name', 'Test']);
  runGit(root, ['config', 'user.email', 'test@example.com']);
  fs.writeFileSync(path.join(root, 'fixture.txt'), 'initial\n', 'utf8');
  runGit(root, ['add', 'fixture.txt']);
  runGit(root, ['commit', '-m', 'initial']);
  return root;
}

let tempRoot: string;

beforeEach(() => {
  tempRoot = makeRepo();
});

afterEach(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe('snapshotWorkingTree', () => {
  it('changes for tracked and untracked working-tree content', () => {
    const clean = snapshotWorkingTree(tempRoot);

    fs.writeFileSync(path.join(tempRoot, 'fixture.txt'), 'changed\n', 'utf8');
    const tracked = snapshotWorkingTree(tempRoot);

    fs.writeFileSync(path.join(tempRoot, 'untracked.txt'), 'new\n', 'utf8');
    const untracked = snapshotWorkingTree(tempRoot);

    expect(tracked).not.toBe(clean);
    expect(untracked).not.toBe(tracked);
  });
});

describe('package.json ci:autofix entry point', () => {
  it('invokes the fixed-point implementation, not the raw verify fixer', () => {
    const packageJson = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));

    expect(packageJson.scripts['ci:autofix']).toBe('node scripts/ciAutofix.ts');
  });
});

describe('workflow autofix commit detection', () => {
  it('keeps a clean repository as an empty staged commit set', () => {
    expect(hasCachedAutofixOutput(tempRoot)).toBe(false);
  });

  it('detects a tracked modification in the staged commit set', () => {
    fs.writeFileSync(path.join(tempRoot, 'fixture.txt'), 'changed\n', 'utf8');
    expect(hasCachedAutofixOutput(tempRoot)).toBe(true);
  });

  it('detects an untracked file in the staged commit set', () => {
    fs.writeFileSync(path.join(tempRoot, 'untracked.txt'), 'new\n', 'utf8');
    expect(hasCachedAutofixOutput(tempRoot)).toBe(true);
  });

  it('detects an untracked symlink in the staged commit set', () => {
    fs.symlinkSync('fixture.txt', path.join(tempRoot, 'untracked-link'));
    expect(hasCachedAutofixOutput(tempRoot)).toBe(true);
  });

  it('detects a deletion in the staged commit set', () => {
    fs.unlinkSync(path.join(tempRoot, 'fixture.txt'));
    expect(hasCachedAutofixOutput(tempRoot)).toBe(true);
  });

  it('stages before cached-diff detection, then checks the token before committing', () => {
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/verify.yml'), 'utf8');
    const step = workflow.slice(workflow.indexOf('      - name: Handle autofix changes'));
    const addIndex = step.indexOf('git add -A');
    const diffIndex = step.indexOf('git diff --cached --quiet --exit-code');
    const tokenIndex = step.indexOf('if [ -z "${BEAVER_CI_AUTOFIX_TOKEN}" ]');
    const commitIndex = step.indexOf('git commit -m "$commit_message"');

    expect(addIndex).toBeGreaterThanOrEqual(0);
    expect(diffIndex).toBeGreaterThan(addIndex);
    expect(tokenIndex).toBeGreaterThan(diffIndex);
    expect(commitIndex).toBeGreaterThan(tokenIndex);
    expect(step.slice(diffIndex, commitIndex)).not.toContain('git add -A');
  });

  it('does not describe a version materialization commit as formatting-only autofix', () => {
    const workflow = fs.readFileSync(path.join(repoRoot, '.github/workflows/verify.yml'), 'utf8');
    const step = workflow.slice(
      workflow.indexOf('      - name: Handle autofix changes'),
      workflow.indexOf('      - name: Upload autofix logs'),
    );

    expect(step).toContain('grep -qx package.json');
    expect(step).toContain(
      'commit_message="chore: materialize release version and apply CI autofix"',
    );
    expect(step).toContain('commit_message="chore: apply CI autofix"');
  });
});

describe('runAutofixIdempotencyCheck', () => {
  it('accepts a fixer that reaches a fixed point after the first pass', () => {
    const result = runAutofixIdempotencyCheck(tempRoot, () => {
      fs.writeFileSync(path.join(tempRoot, 'fixture.txt'), 'canonical\n', 'utf8');
      return 0;
    });

    expect(result).toEqual({ firstStatus: 0, secondStatus: 0, stable: true });
  });

  it('rejects oscillating fixers', () => {
    let next = 'first\n';
    const result = runAutofixIdempotencyCheck(tempRoot, () => {
      fs.writeFileSync(path.join(tempRoot, 'fixture.txt'), next, 'utf8');
      next = next === 'first\n' ? 'second\n' : 'first\n';
      return 0;
    });

    expect(result.stable).toBe(false);
  });

  it('preserves stable fixer failures for the workflow decision', () => {
    const result = runAutofixIdempotencyCheck(tempRoot, () => 2);

    expect(result).toEqual({ firstStatus: 2, secondStatus: 2, stable: true });
  });
});
