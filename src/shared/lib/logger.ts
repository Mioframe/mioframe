const getRandomColorHex = () => {
  return `#${Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0')}`;
};

export const createLogModule = (moduleName: string) => {
  const styles = `color:${getRandomColorHex()}`;

  const log = (message: string, ...args: unknown[]) => {
    console.log(`%c${moduleName}: ${message}`, styles, ...args);
  };

  const debug = (message: string, ...args: unknown[]) => {
    console.debug(`%c${moduleName}: ${message}`, styles, ...args);
  };

  return { log, debug };
};
