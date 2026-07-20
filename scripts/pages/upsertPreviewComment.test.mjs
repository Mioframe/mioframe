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

  it('includes both application and Storybook links when --storybook-url is supplied', async () => {
    let requestBody;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        const method = opts?.method ?? 'GET';
        if (method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }
        requestBody = JSON.parse(opts.body);
        return { ok: true, status: 201, json: async () => ({ id: 99 }) };
      }),
    );

    await upsertPreviewComment(
      [
        '--pr',
        '42',
        '--url',
        'https://example.com/pr-42/',
        '--storybook-url',
        'https://example.com/pr-42/storybook/',
      ],
      ENV,
    );

    expect(requestBody.body).toContain('https://example.com/pr-42/');
    expect(requestBody.body).toContain('https://example.com/pr-42/storybook/');
  });

  it('updates the existing sticky comment rather than duplicating it when --storybook-url is supplied', async () => {
    const comments = [
      {
        id: 77,
        user: { login: 'github-actions[bot]' },
        body: '<!-- gh-pages-preview -->\nold body',
      },
    ];

    let patchCalled = false;
    let postCalled = false;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        const method = opts?.method ?? 'GET';
        if (method === 'GET') {
          return { ok: true, status: 200, json: async () => comments };
        }
        if (method === 'PATCH') {
          patchCalled = true;
          return { ok: true, status: 200, json: async () => ({ id: 77 }) };
        }
        postCalled = true;
        return { ok: true, status: 201, json: async () => ({ id: 99 }) };
      }),
    );

    await upsertPreviewComment(
      [
        '--pr',
        '42',
        '--url',
        'https://example.com/pr-42/',
        '--storybook-url',
        'https://example.com/pr-42/storybook/',
      ],
      ENV,
    );

    expect(patchCalled).toBe(true);
    expect(postCalled).toBe(false);
  });

  it('still works with application-only invocation when --storybook-url is omitted', async () => {
    let requestBody;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, opts) => {
        const method = opts?.method ?? 'GET';
        if (method === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }
        requestBody = JSON.parse(opts.body);
        return { ok: true, status: 201, json: async () => ({ id: 99 }) };
      }),
    );

    await upsertPreviewComment(['--pr', '42', '--url', 'https://example.com/pr-42/'], ENV);

    expect(requestBody.body).toContain('https://example.com/pr-42/');
    expect(requestBody.body).not.toContain('Storybook');
  });

  it('fails clearly when --url is missing', async () => {
    await expect(upsertPreviewComment(['--pr', '42'], ENV)).rejects.toThrow('Usage:');
  });

  it('fails clearly when --pr is missing', async () => {
    await expect(
      upsertPreviewComment(['--url', 'https://example.com/pr-42/'], ENV),
    ).rejects.toThrow('Usage:');
  });

  it('fails clearly when --storybook-url is provided without a value', async () => {
    await expect(
      upsertPreviewComment(
        ['--pr', '42', '--url', 'https://example.com/pr-42/', '--storybook-url'],
        ENV,
      ),
    ).rejects.toThrow('Usage:');
  });
});
