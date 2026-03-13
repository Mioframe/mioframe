import stringify from 'safe-stable-stringify';

export const dedupe = <P extends unknown[], R>(
  fn: (...args: P) => Promise<R>,
  keyFn: (...args: unknown[]) => string = (...args) =>
    stringify.configure({
      strict: true,
    })(args),
): ((...args: P) => Promise<R>) => {
  const inFlight = new Map<string, Promise<R>>();

  return async (...args: P) => {
    const key = keyFn(...args);

    const existing = inFlight.get(key);

    if (existing) {
      return existing;
    }

    const promise = fn(...args).finally(() => {
      inFlight.delete(key);
    });

    inFlight.set(key, promise);

    return promise;
  };
};
