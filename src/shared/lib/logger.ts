import { isFunction } from 'remeda';
import type { MaybeRef } from 'vue';
import { toValue, watchEffect } from 'vue';

const stringToHue = (str: string): number => {
  // Простой хеш на основе суммы кодов символов
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  // Приводим к диапазону от 0 до 360
  return hash % 360;
};

const colorStrings = (...strList: string[]): string[] => {
  const style = strList.reduce<string[]>((pre, str) => {
    const { darkColor, lightColor } = getContrastingColorsFromHSL(str);
    pre.push(
      `color:${darkColor};background-color:${lightColor};padding:2px;border:1px solid ${darkColor};border-radius:5px;`,
    );
    pre.push(' ');
    return pre;
  }, []);

  return [strList.map((s) => `%c${s}`).join('%c '), ...style];
};

const getContrastingColorsFromHSL = (
  str?: string,
): {
  lightColor: string;
  darkColor: string;
} => {
  const h = str ? stringToHue(str) : Math.floor(Math.random() * 360); // случайный оттенок от 0 до 360
  const lightColor = `hsl(${h}, 100%, 90%)`; // светлее
  const darkColor = `hsl(${h}, 100%, 10%)`; // темнее

  return { lightColor, darkColor };
};

console.debug(() => 'test');

/**
 * @deprecated - use default console
 */
export const createLogger = (moduleName: string) => {
  const log = (message: string, ...args: unknown[]) => {
    console.log(...colorStrings(moduleName, message), ...args);
  };

  const debug = (message: string, ...args: unknown[]) => {
    console.debug(
      ...colorStrings(moduleName, message),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- for logger
      ...args.map((v) => (import.meta.env.DEV && isFunction(v) ? v() : v)),
    );
  };

  const debugRef = (message: string, ...args: MaybeRef<unknown>[]) => {
    debug(message, ...args.map(toValue));
  };

  const watchDebug = (message: string, ...args: MaybeRef<unknown>[]) =>
    watchEffect(() => {
      console.debug(
        ...colorStrings(moduleName, '👀', message),

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
