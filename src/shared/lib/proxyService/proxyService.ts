import { isFunction, isString, isUndefined } from 'es-toolkit';
import { get } from 'es-toolkit/compat';
import type { UnknownRecord } from 'type-fest';
import { uid } from 'uid/secure';
import type {
  AnyFunction,
  CallFunctionMessage,
  CallPathMessage,
  CustomTransformer,
  FunctionDescription,
  Provider,
  ClientObject,
  ReadyMessage,
  ReadyQuestionMessage,
  RemoveFunctionMessage,
  ResultMessage,
  SerializeJson,
  Transformer,
} from './types';
import {
  zodCallFunctionMessage,
  zodCallPathMessage,
  zodReadyMessage,
  zodReadyQuestionMessage,
  zodRemoveFunctionMessage,
  zodResultMessage,
} from './types';
import { zodIs } from '../validateZodScheme';
import SuperJSON from 'superjson';

const callRemotePath = async (
  provider: Provider,
  serviceId: string,
  path: string[],
  args: unknown[],
) => {
  await waitServiceReady(provider, serviceId);

  return new Promise((resolve, reject) => {
    const requestPayload: CallPathMessage = {
      serviceId,
      callId: uid(),
      args: serialize(args),
      path,
    };

    pendingRequests.set(requestPayload.callId, { resolve, reject });

    provider.postMessage(requestPayload);
  });
};

const callPath = async (
  target: UnknownRecord,
  path: string[],
  args: unknown[],
): Promise<unknown> => {
  const mbFn = get(target, path);
  if (!isFunction(mbFn)) {
    throw new Error(`${path.join('.')} is not a function`);
  }

  return await mbFn(...args);
};

const createProxy = <T extends Record<string, unknown>, Exceptions = unknown>(
  provider: Provider,
  serviceId: string,
  path: string[] = [],
): ClientObject<T, Exceptions> => {
  return new Proxy((() => ({})) as object, {
    get: (_target, prop) => {
      if (isString(prop)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return createProxy(provider, serviceId, [...path, prop]);
      }
      return undefined;
    },
    apply: (_target, _thisArg, argArray) => {
      return callRemotePath(provider, serviceId, path, argArray);
    },
  }) as ClientObject<T, Exceptions>;
};

const serviceReadyRegister = new Set<string>();

const waitServiceReady = (
  provider: Provider,
  serviceId: string,
  timeout = 5e3,
) => {
  const readyQuestion: ReadyQuestionMessage = {
    areYouReady: true,
    serviceId,
  };

  return new Promise<void>((resolve, reject) => {
    if (serviceReadyRegister.has(serviceId)) {
      resolve();
    } else {
      const timeoutId = setTimeout(() => {
        reject(new Error(`The service was not ready in ${timeout} ms`));
      }, timeout);

      const handler = ({ data }: { data: unknown }) => {
        if (zodIs(data, zodReadyMessage)) {
          clearTimeout(timeoutId);

          serviceReadyRegister.add(serviceId);

          resolve();

          provider.removeEventListener('message', handler);
        }
      };
      provider.addEventListener('message', handler);
      provider.postMessage(readyQuestion);
    }
  });
};

export const defineTransformer = <T, J>(
  name: string,
  v: CustomTransformer<T, J>,
): [string, CustomTransformer<T, J>] => [name, v];

export const createClient = <T extends UnknownRecord, Exceptions = unknown>(
  provider: Provider,
  serviceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- support any transformer
  transformers?: Transformer<any, any>[],
) => {
  createService(provider, serviceId, transformers);
  return createProxy<T, Exceptions>(provider, serviceId);
};

const localFunctions = new Map<string, AnyFunction>();

const remoteFunctions = new WeakMap<AnyFunction, FunctionDescription>();

/**
 * Создание описание функции для передачи
 * @param provider
 * @param localFunction
 * @returns
 */
const createFunctionDescription = <F extends AnyFunction>(
  localFunction: F,
): FunctionDescription<F> => {
  const functionId = uid();

  const functionDescription: FunctionDescription<F> = {
    functionId,
  } as FunctionDescription<F>;

  localFunctions.set(functionId, localFunction);

  return functionDescription;
};

const remoteFunctionsRegistry = new FinalizationRegistry(
  ({
    serviceId,
    functionId,
    provider,
  }: {
    serviceId: string;
    functionId: string;
    provider: Provider;
  }) => {
    const removeFunctionMessage: RemoveFunctionMessage = {
      serviceId,
      removeFunctionId: functionId,
    };

    provider.postMessage(removeFunctionMessage);
  },
);

const createProxyFunction = (
  provider: Provider,
  serviceId: string,
  remoteFunctionDescription: FunctionDescription,
) => {
  const { functionId } = remoteFunctionDescription;

  const proxyFunction = async (...args: unknown[]) => {
    await waitServiceReady(provider, serviceId);

    return new Promise((resolve, reject) => {
      const callDescription: CallFunctionMessage = {
        serviceId,
        callId: functionId,
        args: serialize(args),
      };

      pendingRequests.set(functionId, { resolve, reject });

      provider.postMessage(callDescription);
    });
  };

  remoteFunctions.set(proxyFunction, remoteFunctionDescription);
  remoteFunctionsRegistry.register(proxyFunction, {
    serviceId,
    functionId,
    provider,
  });

  return proxyFunction;
};

const sendResult = async (
  provider: Provider,
  serviceId: string,
  resultId: string,
  result: unknown,
) => {
  await waitServiceReady(provider, serviceId);

  const resultMessage: ResultMessage = {
    serviceId,
    resultId,
    result: serialize(result),
  };

  provider.postMessage(resultMessage);
};

const sendError = async (
  provider: Provider,
  serviceId: string,
  resultId: string,
  error: unknown,
) => {
  const resultMessage: ResultMessage = {
    serviceId,
    resultId,
    error: serialize(error),
  };

  await waitServiceReady(provider, serviceId);

  provider.postMessage(resultMessage);
};

const pendingRequests = new Map<
  string,
  { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }
>();

const serviceRegister = new Set<string>();

const superJson = new SuperJSON({ dedupe: true });

export const serialize = <T>(data: T) =>
  superJson.serialize(data) as SerializeJson<T>;

export const deserialize = <T>(data: SerializeJson<T>) =>
  superJson.deserialize<T>(data);

export const createService = (
  provider: Provider,
  serviceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- support any transformer
  transformers?: Transformer<any, any>[],
  setup?: () => UnknownRecord,
) => {
  if (serviceRegister.has(serviceId)) {
    throw new Error(
      `Service "${serviceId}" is already registered in the current execution context.`,
    );
  }

  serviceRegister.add(serviceId);

  superJson.registerCustom(
    {
      isApplicable: isFunction,
      serialize: (v) => createFunctionDescription(v),
      deserialize: (v: FunctionDescription) =>
        createProxyFunction(provider, serviceId, v),
    },
    'proxyFunction',
  );

  transformers?.forEach(([name, transformer]) => {
    superJson.registerCustom(
      {
        isApplicable: transformer.isApplicable,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- support any
        deserialize: (v) => transformer.deserialize(provider, v),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- support any
        serialize: (v) => transformer.serialize(provider, v),
      },
      name,
    );
  });

  const state = setup?.();

  const postReady = () => {
    const readyMessage: ReadyMessage = { serviceId, ready: true };

    provider.postMessage(readyMessage);
  };

  const messageHandler = async ({ data }: { data: unknown }) => {
    if (
      state &&
      zodIs(data, zodCallPathMessage) &&
      data.serviceId === serviceId
    ) {
      const { args, callId, path } = data;
      try {
        const result = await callPath(state, path, deserialize(args));
        await sendResult(provider, serviceId, callId, result);
      } catch (error) {
        await sendError(provider, serviceId, callId, error);
      }
    } else if (
      zodIs(data, zodCallFunctionMessage) &&
      data.serviceId === serviceId
    ) {
      const { args, callId } = data;

      try {
        const fn = localFunctions.get(callId);
        if (fn) {
          const result = await fn(...deserialize(args));
          await sendResult(provider, serviceId, callId, result);
        } else {
          throw new Error(`function "${callId}" not found`);
        }
      } catch (error) {
        await sendError(provider, serviceId, callId, error);
      }
    } else if (zodIs(data, zodResultMessage) && data.serviceId === serviceId) {
      const { resultId, error, result } = data;

      const request = pendingRequests.get(resultId);
      if (request) {
        const { reject, resolve } = request;
        if (error) {
          reject(deserialize(error));
        } else {
          resolve(!isUndefined(result) ? deserialize(result) : undefined);
        }
      } else {
        // eslint-disable-next-line no-console -- warning for developers
        console.warn(`don't have pending for result ${resultId}`);
      }
    } else if (
      zodIs(data, zodRemoveFunctionMessage) &&
      data.serviceId === serviceId
    ) {
      const { removeFunctionId } = data;
      localFunctions.delete(removeFunctionId);
    } else if (zodIs(data, zodReadyQuestionMessage)) {
      postReady();
    }
  };

  provider.addEventListener('message', messageHandler);

  postReady();
};
