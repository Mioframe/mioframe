const generateKey = (
  method: string,
  url: string,
  accessToken: string,
): string => {
  return `${accessToken}:${method}:${url}`;
};

class RequestDeduplicator {
  private pending = new Map<string, Promise<unknown>>();

  async exec<R>(
    method: string,
    url: string,
    accessToken: string,
    requestFn: () => Promise<R>,
  ): Promise<R> {
    const key = generateKey(method, url, accessToken);

    const existing = this.pending.get(key);
    if (existing) {
      return existing.then((value) => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Generic type constraint requires assertion for Map
        return value as R;
      });
    }

    const promise = requestFn();
    this.pending.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }

  clear(): void {
    this.pending.clear();
  }
}

export const requestDeduplicator = new RequestDeduplicator();
