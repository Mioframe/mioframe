import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { upsertPreviewComment } from './upsertPreviewComment.mjs';

const ENV = { GITHUB_TOKEN: 'token', GITHUB_REPOSITORY: 'owner/repo' };

function makeFetchMock(comments) {
  let callCount = 0;
  return vi.fn(async () => {
    callCount++;
    // First call: list comments; second call: create/update.
    if (callCount === 1) {
      return {
        ok: true,
        status: 200,
        json: async () => comments,
      };
    }
    return { ok: true, status: 201, json: async () => ({ id: 99 }) };
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('upsertPreviewComment', () => {
  it('does not throw when a comment has no user field', async () => {
    const comments = [
      { id: 1, body: '<!-- gh-pages-preview -->\nold body' },
      // user is absent — would throw without optional chaining
    ];
    vi.stubGlobal('fetch', makeFetchMock(comments));

    // Should create a new comment (no existing match since user is absent).
    await expect(
      upsertPreviewComment(['--pr', '42', '--url', 'https://example.com/pr-42/'], ENV),
    ).resolves.toBeUndefined();
  });

  it('does not throw when a comment has user: null', async () => {
    const comments = [{ id: 2, user: null, body: '<!-- gh-pages-preview -->\nold body' }];
    vi.stubGlobal('fetch', makeFetchMock(comments));

    await expect(
      upsertPreviewComment(['--pr', '42', '--url', 'https://example.com/pr-42/'], ENV),
    ).resolves.toBeUndefined();
  });

  it('does not throw when a comment has the bot user but no body', async () => {
    const comments = [{ id: 3, user: { login: 'github-actions[bot]' } }];
    vi.stubGlobal('fetch', makeFetchMock(comments));

    // body is absent — would throw without optional chaining on c.body
    await expect(
      upsertPreviewComment(['--pr', '42', '--url', 'https://example.com/pr-42/'], ENV),
    ).resolves.toBeUndefined();
  });

  it('updates the existing bot comment when found', async () => {
    const comments = [
      {
        id: 55,
        user: { login: 'github-actions[bot]' },
        body: '<!-- gh-pages-preview -->\nold body',
      },
    ];

    let patchCalled = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        const method = opts?.method ?? 'GET';
        if (method === 'GET') {
          return { ok: true, status: 200, json: async () => comments };
        }
        if (method === 'PATCH') {
          patchCalled = true;
          return { ok: true, status: 200, json: async () => ({ id: 55 }) };
        }
        return { ok: true, status: 201, json: async () => ({ id: 99 }) };
      }),
    );

    await upsertPreviewComment(['--pr', '42', '--url', 'https://example.com/pr-42/'], ENV);

    expect(patchCalled).toBe(true);
  });
});
