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
    pre.push('');
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

export const createLogModule = (moduleName: string) => {
  const log = (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console -- for logger
    console.log(...colorStrings(moduleName, message), ...args);
  };

  const debug = (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console -- for logger
    console.debug(...colorStrings(moduleName, message), ...args);
  };

  return { log, debug };
};
