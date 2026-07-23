/**
 * Create the private controller mutation queue.
 * @returns A serializer that runs one controller mutation at a time and remains usable after a
 *   rejected mutation.
 */
export const createCommandQueue = () => {
  let tail = Promise.resolve<unknown>(undefined);

  return <Result>(command: () => Promise<Result>): Promise<Result> => {
    const result = tail.then(command, command);
    tail = result.catch(() => undefined);
    return result;
  };
};
