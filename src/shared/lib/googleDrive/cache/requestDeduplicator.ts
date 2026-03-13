const generateKey = (
  method: string,
  url: string,
  accessToken: string,
): string => {
  return `${accessToken}:${method}:${url}`;
};

class RequestDeduplicator {
  private pending = new Map<string, WeakRef<Promise<any>>>();

  async exec<R>(
    method: string,
    url: string,
    accessToken: string,
    requestFn: () => Promise<R>,
  ): Promise<R> {
    const key = generateKey(method, url, accessToken);

    const existingRef = this.pending.get(key);
    if (existingRef) {
      const existing = existingRef.deref();
      if (existing) {
        return Promise.resolve(existing.then((value) => value)) as R;
      }
      this.pending.delete(key);
    }

    const promise = requestFn();
    this.pending.set(key, new WeakRef(promise));

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
