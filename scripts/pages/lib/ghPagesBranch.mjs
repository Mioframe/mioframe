import { cpSync, execSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { basename, join } from 'node:path';
import { tmpdir } from 'node:os';

const BRANCH = 'gh-pages';
const MAX_PUSH_ATTEMPTS = 5;

/**
 * Configure git identity and credentials for GitHub Actions.
 * @param cwd Working directory.
 * @param repoUrl Authenticated remote URL.
 */
function configureGit(cwd, repoUrl) {
  execSync('git config user.name "github-actions[bot]"', { cwd, stdio: 'inherit' });
  execSync('git config user.email "41898282+github-actions[bot]@users.noreply.github.com"', {
    cwd,
    stdio: 'inherit',
  });
  execSync(`git remote set-url origin "${repoUrl}"`, { cwd, stdio: 'inherit' });
}

/**
 * Build an authenticated HTTPS remote URL using the given token.
 * @param token GitHub token.
 * @param repository OWNER/REPO string.
 * @returns Authenticated remote URL.
 */
function buildAuthUrl(token, repository) {
  return `https://x-access-token:${token}@github.com/${repository}.git`;
}

/**
 * Push to the gh-pages branch, rebasing on conflict and retrying.
 * @param cwd Working directory.
 */
function pushWithRetry(cwd) {
  for (let attempt = 1; attempt <= MAX_PUSH_ATTEMPTS; attempt++) {
    try {
      execSync(`git push origin ${BRANCH}`, { cwd, stdio: 'inherit' });
      return;
    } catch {
      if (attempt === MAX_PUSH_ATTEMPTS) {
        throw new Error(`Failed to push to ${BRANCH} after ${MAX_PUSH_ATTEMPTS} attempts`);
      }
      console.log(`Push failed (attempt ${attempt}), rebasing and retrying...`);
      execSync(`git fetch origin ${BRANCH}`, { cwd, stdio: 'inherit' });
      execSync(`git rebase origin/${BRANCH}`, { cwd, stdio: 'inherit' });
    }
  }
}

/**
 * Clone or initialise the gh-pages branch into a temporary directory, run the
 * given callback with the working directory path, commit, push, and clean up.
 *
 * When `outputDir` is provided the final staging content (excluding `.git`) is
 * copied there after the commit so the caller can upload it as a GitHub Pages
 * artifact. The copy happens regardless of whether there were any changes,
 * so the artifact always reflects the full current Pages state.
 * @param options Deployment options.
 * @param options.token GitHub token with contents:write.
 * @param options.repository OWNER/REPO string.
 * @param options.commitMessage Commit message to use.
 * @param options.outputDir Optional directory to receive the staged Pages content.
 * @param options.fn
 *   Callback that mutates the working directory before the commit.
 * @returns Promise that resolves when publish is complete.
 */
export async function withGhPagesBranch({ token, repository, commitMessage, outputDir, fn }) {
  const repoUrl = buildAuthUrl(token, repository);
  const workDir = mkdtempSync(join(tmpdir(), 'gh-pages-work-'));

  try {
    let branchExists = true;
    try {
      execSync(`git clone --branch ${BRANCH} --single-branch --depth 1 "${repoUrl}" .`, {
        cwd: workDir,
        stdio: 'inherit',
      });
    } catch {
      // Branch does not exist yet — create an orphan branch.
      branchExists = false;
      execSync('git init', { cwd: workDir, stdio: 'inherit' });
      execSync(`git remote add origin "${repoUrl}"`, { cwd: workDir, stdio: 'inherit' });
      execSync(`git checkout --orphan ${BRANCH}`, { cwd: workDir, stdio: 'inherit' });
    }

    configureGit(workDir, repoUrl);

    await fn(workDir);

    const status = execSync('git status --porcelain', { cwd: workDir }).toString().trim();
    if (status) {
      execSync('git add -A', { cwd: workDir, stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { cwd: workDir, stdio: 'inherit' });

      if (branchExists) {
        pushWithRetry(workDir);
      } else {
        execSync(`git push origin ${BRANCH}`, { cwd: workDir, stdio: 'inherit' });
      }
    } else {
      console.log('Nothing to commit, gh-pages branch is already up-to-date.');
    }

    if (outputDir) {
      rmSync(outputDir, { recursive: true, force: true });
      mkdirSync(outputDir, { recursive: true });
      cpSync(workDir, outputDir, {
        recursive: true,
        filter: (src) => basename(src) !== '.git',
      });
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}
