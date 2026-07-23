/* eslint-disable jsdoc/require-jsdoc -- The single internal queue factory is named by its complete contract. */
export const createCommandQueue = () => {
  let tail = Promise.resolve<unknown>(undefined);

  return <Result>(command: () => Promise<Result>): Promise<Result> => {
    const result = tail.then(command, command);
    tail = result.catch(() => undefined);
    return result;
  };
};
/* eslint-enable jsdoc/require-jsdoc -- End internal queue factory. */
