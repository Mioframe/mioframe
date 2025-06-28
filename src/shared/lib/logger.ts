import { isFunction } from 'es-toolkit';
import type { MaybeRef } from 'vue';
import { toValue, watchEffect } from 'vue';

/**
 * @deprecated - use normal console as printing source file link is not supported
 */
export const createLogger = (moduleName: string) => {
  const log = (message: string, ...args: unknown[]) => {
    console.log(moduleName, message, ...args);
  };

  const debug = (message: string, ...args: unknown[]) => {
    console.debug(
      moduleName,
      message,

      ...args.map((v) => (import.meta.env.DEV && isFunction(v) ? v() : v)),
    );
  };

  const debugRef = (message: string, ...args: MaybeRef<unknown>[]) => {
    debug(message, ...args.map(toValue));
  };

  const watchDebug = (message: string, ...args: MaybeRef<unknown>[]) =>
    watchEffect(() => {
      console.debug(
        moduleName,
        '👀',
        message,

        ...args.map(toValue),
      );
    });

  return { log, debug, debugRef, watchDebug };
};

export const debugWrapper =
  <P extends [], R>(fn: (...args: P) => R): ((...args: P) => R) =>
  (...args: P): R => {
    console.groupCollapsed(`DEBUG: call ${fn.name || 'anonymous function'}`);
    console.debug('Arguments:', args);

    const start = performance.now();
    const result: R = fn(...args);
    const end = performance.now();

    console.debug('Result:', result);
    console.debug(`lead time: ${(end - start).toFixed(3)} ms`);
    console.groupEnd();

    return result;
  };
