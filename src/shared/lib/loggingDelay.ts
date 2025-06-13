import { isPromise, isString } from 'es-toolkit';

export function loggingDelay<A extends unknown[], R>(
  fn: (...args: A) => Promise<R>,
  name?: string,
): (...args: A) => Promise<R>;
export function loggingDelay<A extends unknown[], R>(
  fn: (...args: A) => R,
  name?: string,
): (...args: A) => R;
export function loggingDelay<A extends unknown[], R>(
  fn: (...args: A) => R | Promise<R>,
  name?: string,
): (...args: A) => R | Promise<R> {
  const functionName = name ?? (isString(fn.name) ? fn.name : 'unknown');

  return (...args: A): R | Promise<R> => {
    const start = performance.now();
    try {
      const result = fn(...args);

      if (isPromise(result)) {
        return result
          .then((value: R) => {
            const end = performance.now();
            console.log(
              `Async function "${functionName}" completed in ${end - start} ms`,
            );
            return value;
          })
          .catch((error: unknown) => {
            const end = performance.now();
            console.log(
              `Async function "${functionName}" completed with error in ${end - start} ms`,
            );
            throw error;
          });
      } else {
        const end = performance.now();
        console.log(
          `Sync function "${functionName}" completed in ${end - start} ms`,
        );
        return result;
      }
    } catch (error) {
      const end = performance.now();
      console.log(
        `Sync function "${functionName}" completed with error in ${end - start} ms`,
      );
      throw error;
    }
  };
}
