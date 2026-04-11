import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useGoogleSessionAvatar } from './useGoogleSessionAvatar';

type Deferred<T> = {
  promise: Promise<T>;
  reject: (error?: unknown) => void;
  resolve: (value: T) => void;
};

const createDeferred = <T>(): Deferred<T> => {
  let resolve!: (value: T) => void;
  let reject!: (error?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
};

const flushAsyncUpdates = async () => {
  await Promise.resolve();
  await Promise.resolve();
  await nextTick();
};

const fetchMock = vi.fn<typeof fetch>();
const createObjectURLMock = vi.fn<(blob: Blob) => string>();
const revokeObjectURLMock = vi.fn<(url: string) => void>();

const mountGoogleSessionAvatarComposable = (initialProfileImageUrl?: string) => {
  const profileImageUrl = ref(initialProfileImageUrl);
  const scope = effectScope();
  let state!: ReturnType<typeof useGoogleSessionAvatar>;

  scope.run(() => {
    state = useGoogleSessionAvatar(profileImageUrl);
  });

  return {
    profileImageUrl,
    scope,
    state,
  };
};

beforeEach(() => {
  fetchMock.mockReset();
  createObjectURLMock.mockReset();
  revokeObjectURLMock.mockReset();

  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal(
    'URL',
    class extends URL {
      public static override createObjectURL = createObjectURLMock;
      public static override revokeObjectURL = revokeObjectURLMock;
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useGoogleSessionAvatar', () => {
  it('does not create a blob URL after disposing a pending avatar request', async () => {
    const deferredResponse = createDeferred<Response>();

    fetchMock.mockImplementationOnce(async (_input, init) => {
      void init;
      return deferredResponse.promise;
    });

    const { scope, state } = mountGoogleSessionAvatarComposable('https://example.com/avatar.png');
    await flushAsyncUpdates();

    expect(state.isLoading.value).toBe(true);

    scope.stop();

    const fetchSignal = fetchMock.mock.calls[0]?.[1]?.signal;

    expect(fetchSignal?.aborted).toBe(true);

    deferredResponse.resolve(new Response(new Blob(['avatar']), { status: 200 }));
    await flushAsyncUpdates();

    expect(createObjectURLMock).not.toHaveBeenCalled();
    expect(revokeObjectURLMock).not.toHaveBeenCalled();
  });

  it('revokes the active blob URL on dispose after a successful load', async () => {
    createObjectURLMock.mockReturnValueOnce('blob:avatar-success');
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['avatar']), { status: 200 }));

    const { scope, state } = mountGoogleSessionAvatarComposable('https://example.com/avatar.png');
    await flushAsyncUpdates();

    expect(state.profileImageBlobUrl.value).toBe('blob:avatar-success');
    expect(state.showProfileImage.value).toBe(true);
    expect(state.isLoading.value).toBe(false);

    scope.stop();

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:avatar-success');
  });

  it('ignores a stale in-flight request after the profile image URL changes', async () => {
    const initialResponse = createDeferred<Response>();

    fetchMock.mockImplementationOnce(async () => initialResponse.promise);
    fetchMock.mockResolvedValueOnce(new Response(new Blob(['next-avatar']), { status: 200 }));
    createObjectURLMock.mockReturnValueOnce('blob:avatar-next');

    const { profileImageUrl, scope, state } = mountGoogleSessionAvatarComposable(
      'https://example.com/avatar-initial.png',
    );
    await flushAsyncUpdates();

    profileImageUrl.value = 'https://example.com/avatar-next.png';
    await flushAsyncUpdates();
    await flushAsyncUpdates();

    const initialFetchSignal = fetchMock.mock.calls[0]?.[1]?.signal;

    expect(initialFetchSignal?.aborted).toBe(true);
    expect(state.profileImageBlobUrl.value).toBe('blob:avatar-next');
    expect(state.showProfileImage.value).toBe(true);
    expect(state.isLoading.value).toBe(false);
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    initialResponse.resolve(new Response(new Blob(['stale-avatar']), { status: 200 }));
    await flushAsyncUpdates();

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);

    scope.stop();
  });
});
