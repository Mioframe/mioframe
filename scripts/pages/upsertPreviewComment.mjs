/**
 * Create or update a single sticky PR comment with the preview URL.
 *
 * Finds an existing comment from the GitHub Actions bot that contains the
 * preview marker, then updates it in place. If no such comment exists, a new
 * one is created. This ensures one comment per PR regardless of how many
 * times the preview is re-deployed.
 *
 * Usage:
 *   node scripts/pages/upsertPreviewComment.mjs --pr 42 --url https://...
 *
 * Required env:
 *   GITHUB_TOKEN      - token with pull-requests:write
 *   GITHUB_REPOSITORY - OWNER/REPO
 */

import { pathToFileURL } from 'node:url';

const COMMENT_MARKER = '<!-- gh-pages-preview -->';
const BOT_LOGIN = 'github-actions[bot]';

/**
 * @param url
 * @param options
 * @param options.token
 * @param [options.method]
 * @param [options.body]
 * @returns
 */
async function githubFetch(url, { token, method = 'GET', body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`GitHub API ${method} ${url} → ${response.status}: ${text}`);
  }

  return response.status === 204 ? null : response.json();
}

/**
 * Build the comment body for the given preview URL.
 * @param previewUrl
 * @returns
 */
function buildCommentBody(previewUrl) {
  return [
    COMMENT_MARKER,
    '### Preview deployment',
    '',
    `The latest build for this PR is available at: ${previewUrl}`,
    '',
    '_This comment is updated automatically on every push to this PR._',
  ].join('\n');
}

/**
 * @param argv Process arguments (process.argv.slice(2)).
 * @param env Process environment.
 */
export async function upsertPreviewComment(argv = process.argv.slice(2), env = process.env) {
  const prIndex = argv.indexOf('--pr');
  const urlIndex = argv.indexOf('--url');

  if (prIndex === -1 || !argv[prIndex + 1]) {
    throw new Error('Usage: upsertPreviewComment.mjs --pr <number> --url <preview-url>');
  }
  if (urlIndex === -1 || !argv[urlIndex + 1]) {
    throw new Error('Usage: upsertPreviewComment.mjs --pr <number> --url <preview-url>');
  }

  const prNumber = argv[prIndex + 1];
  const previewUrl = argv[urlIndex + 1];

  if (!/^\d+$/.test(prNumber)) {
    throw new Error(`Invalid PR number: ${prNumber}`);
  }

  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = env;
  if (!GITHUB_TOKEN) throw new Error('GITHUB_TOKEN is required');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is required');

  const apiBase = `https://api.github.com/repos/${GITHUB_REPOSITORY}`;
  const body = buildCommentBody(previewUrl);

  // List comments and find an existing sticky one.
  const comments = await githubFetch(`${apiBase}/issues/${prNumber}/comments?per_page=100`, {
    token: GITHUB_TOKEN,
  });

  const existing = comments.find(
    (c) => c.user.login === BOT_LOGIN && c.body.includes(COMMENT_MARKER),
  );

  if (existing) {
    await githubFetch(`${apiBase}/issues/comments/${existing.id}`, {
      token: GITHUB_TOKEN,
      method: 'PATCH',
      body: { body },
    });
    console.log(`Updated existing preview comment (id ${existing.id}) on PR #${prNumber}.`);
  } else {
    await githubFetch(`${apiBase}/issues/${prNumber}/comments`, {
      token: GITHUB_TOKEN,
      method: 'POST',
      body: { body },
    });
    console.log(`Created preview comment on PR #${prNumber}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await upsertPreviewComment();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
