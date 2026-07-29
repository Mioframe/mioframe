import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope } from 'vue';

const requestTokenMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    google: {
      requestToken: requestTokenMock,
    },
  }),
}));

const mountRecovery = async () => {
  const scope = effectScope();
  const { useGoogleDriveRecovery } = await import('./useGoogleDriveRecovery');
  let recovery: ReturnType<typeof useGoogleDriveRecovery> | undefined;

  scope.run(() => {
    recovery = useGoogleDriveRecovery({
      path: '/Google Drive/work@example.com/My Drive',
    });
  });

  if (!recovery) {
    throw new Error('Expected Google Drive recovery action');
  }

  return { recovery, scope };
};

describe('useGoogleDriveRecovery', () => {
  afterEach(() => {
    requestTokenMock.mockReset();
  });

  it.each(['resolve', 'reject'] as const)(
    'exposes pending authorization feedback once and restores availability after %s',
    async (outcome) => {
      let settleRequest: (() => void) | undefined;
      requestTokenMock.mockImplementation(
        () =>
          new Promise<void>((resolve, reject) => {
            settleRequest = () => {
              if (outcome === 'resolve') {
                resolve();
              } else {
                reject(new Error('provider rejected'));
              }
            };
          }),
      );
      const { recovery, scope } = await mountRecovery();

      const requestPromise = recovery.retryAuthorization();

      expect(recovery.isRetryAuthorizationPending.value).toBe(true);
      expect(recovery.retryAuthorizationPendingMessage.value).toBe(
        'Complete authorization in the provider window.',
      );

      await recovery.retryAuthorization();
      expect(requestTokenMock).toHaveBeenCalledTimes(1);

      settleRequest?.();

      if (outcome === 'resolve') {
        await expect(requestPromise).resolves.toBeUndefined();
      } else {
        await expect(requestPromise).rejects.toThrow('provider rejected');
      }

      expect(recovery.isRetryAuthorizationPending.value).toBe(false);
      expect(recovery.retryAuthorizationPendingMessage.value).toBeUndefined();

      scope.stop();
    },
  );
});
