const stringToHue = (str: string): number => {
  // Простой хеш на основе суммы кодов символов
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash += str.charCodeAt(i);
  }
  // Приводим к диапазону от 0 до 360
  return hash % 360;
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
  const { darkColor, lightColor } = getContrastingColorsFromHSL(moduleName);
  const styles = `color:${darkColor};background-color:${lightColor};padding:2px;border:1px solid ${darkColor};border-radius:5px;`;

  const log = (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console -- for logger
    console.log(`%c${moduleName}: ${message}`, styles, ...args);
  };

  const debug = (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console -- for logger
    console.debug(`%c${moduleName}: ${message}`, styles, ...args);
  };

  return { log, debug };
};
