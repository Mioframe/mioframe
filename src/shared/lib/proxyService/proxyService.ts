/**
 * Implementation of proxy service functionality that enables remote function calls and object property access.
 *
 * This module provides utilities for creating clients and services that can communicate across different execution contexts,
 * allowing functions to be called remotely on a server-side object as if they were local.
 *
 * @module ProxyService
 */

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
  TransformerRegistration,
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

/**
 * Calls a remote function by path on the specified service.
 *
 * This internal helper routes calls through the communication provider to execute functions
 * located at a specific path within a remote object structure.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param path - Path to follow to find the function (e.g., ['obj', 'method'])
 * @param args - Arguments to pass to the remote function
 * @returns Promise that resolves with the result of the function call or rejects with an error
 */
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

/**
 * Calls a function at the specified path in an object.
 *
 * This utility function navigates through nested object properties using a path array
 * and executes the final property if it's a function, throwing an error if not found.
 *
 * @param target - Target record to find and execute the function on
 * @param path - Path of properties leading to the function (e.g., ['obj', 'method'])
 * @param args - Arguments to pass to the found function
 * @returns Promise that resolves with the result or rejects if no function is found
 */
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

/**
 * Creates a proxy object that can be used to make remote calls.
 *
 * This function creates a JavaScript Proxy that intercepts property access and method calls,
 * routing them through the communication provider to the appropriate remote service.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param path - Current path in the proxy chain (used internally)
 * @returns A proxied object that will route operations to the remote service
 */
const createProxy = <T extends Record<string, unknown>, Exceptions = never>(
  provider: Provider,
  serviceId: string,
  path: string[] = [],
): ClientObject<T, Exceptions> => {
  const target: object = () => ({});

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Proxy construction for ClientObject requires assertion
  return new Proxy(target, {
    get: (_target, prop) => {
      if (isString(prop)) {
        // createProxy recursively builds nested proxies based on path

        return createProxy(provider, serviceId, [...path, prop]);
      }
      return undefined;
    },
    apply: (_target, _thisArg, argArray) => {
      return callRemotePath(provider, serviceId, path, argArray);
    },
  }) as ClientObject<T, Exceptions>;
};

/**
 * Set of service identifiers that have confirmed they are ready.
 */
const serviceReadyRegister = new Set<string>();

/**
 * Waits for a service to be ready before proceeding with operations.
 *
 * This function implements a handshake mechanism between client and service,
 * ensuring that remote services are properly initialized before making calls.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param timeout - Maximum time (in ms) to wait for readiness
 * @returns Promise that resolves when the service is confirmed ready or rejects on timeout
 */
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
      const handler = ({ data }: { data: unknown }) => {
        if (zodIs(data, zodReadyMessage) && data.serviceId === serviceId) {
          clearTimeout(timeoutId);
          provider.removeEventListener('message', handler);

          serviceReadyRegister.add(serviceId);

          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        provider.removeEventListener('message', handler);
        reject(new Error(`The service was not ready in ${timeout} ms`));
      }, timeout);

      provider.addEventListener('message', handler);
      provider.postMessage(readyQuestion);
    }
  });
};

/**
 * Creates a transformer registration closure for custom serialization/deserialization.
 *
 * This utility function helps register custom types with SuperJSON
 * to handle special data types during cross-context communication.
 *
 * @param name - Name of the transformer
 * @param v - Custom transformer implementation
 * @returns A closure that can be called with SuperJSON and Provider to register the transformer
 */
export const defineTransformer = <T, J>(
  name: string,
  v: CustomTransformer<T, J>,
): TransformerRegistration => {
  return (superJson: SuperJSON, provider: Provider) => {
    superJson.registerCustom(
      {
        isApplicable: v.isApplicable,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Custom type validation happens internally
        deserialize: (val) => v.deserialize(provider, val as J),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-return, @typescript-eslint/consistent-type-assertions -- SuperJSON expects strict JSONValue, but custom transformers can return arbitrary objects
        serialize: (val) => v.serialize(provider, val) as any,
      },
      name,
    );
  };
};

/**
 * Creates a client that can make remote calls to a service.
 *
 * This is the primary entry point for creating proxy clients that enable calling
 * methods on remote services as if they were local objects.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param transformers - Optional custom transformers for data serialization/deserialization
 * @returns A proxy object that allows remote method calls on the server-side service
 */
export const createClient = <T extends UnknownRecord, Exceptions = never>(
  provider: Provider,
  serviceId: string,
  transformers?: TransformerRegistration[],
) => {
  createService(provider, serviceId, transformers);
  return createProxy<T, Exceptions>(provider, serviceId);
};

/**
 * Map of local functions that can be called from remote contexts.
 */
const localFunctions = new Map<string, AnyFunction>();

/**
 * WeakMap storing function descriptions for remote functions.
 */
const remoteFunctions = new WeakMap<AnyFunction, FunctionDescription>();

/**
 * Creates a description of a function for transmission over the wire.
 *
 * This utility creates metadata about functions so they can be properly identified
 * and routed when called from remote execution contexts.
 *
 * @param localFunction - The original local function
 * @returns A description that can be serialized and sent to remote contexts
 */
const createFunctionDescription = <F extends AnyFunction>(
  localFunction: F,
): FunctionDescription<F> => {
  const functionId = uid();

  // FunctionDescription is a branded type requiring assertion to match inferred type
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Branded type requires assertion to preserve function type
  const functionDescription: FunctionDescription<F> = {
    functionId,
  } as FunctionDescription<F>;

  localFunctions.set(functionId, localFunction);

  return functionDescription;
};

/**
 * Finalization registry for cleaning up remote functions when they're garbage collected.
 */
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

/**
 * Creates a proxy function that forwards calls to the remote service.
 *
 * This function generates a local proxy that, when invoked, will route execution
 * to the appropriate remote function through the communication provider.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param remoteFunctionDescription - Description of the remote function to create a proxy for
 * @returns A function that when called, will forward arguments to the remote service
 */
const createProxyFunction = (
  provider: Provider,
  serviceId: string,
  remoteFunctionDescription: FunctionDescription,
) => {
  const { functionId } = remoteFunctionDescription;

  const proxyFunction = async (...args: unknown[]) => {
    await waitServiceReady(provider, serviceId);

    return new Promise((resolve, reject) => {
      const callId = uid();
      const callDescription: CallFunctionMessage = {
        serviceId,
        callId,
        functionId,
        args: serialize(args),
      };

      pendingRequests.set(callId, { resolve, reject });

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

/**
 * Sends a result message back to the requester.
 *
 * Called from the service-side message handler after processing a call.
 * No readiness check needed — the caller already completed the handshake before sending the call.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param resultId - ID of the request that this is a response to
 * @param result - The actual result data to send
 */
const sendResult = (
  provider: Provider,
  serviceId: string,
  resultId: string,
  result: unknown,
) => {
  const resultMessage: ResultMessage = {
    serviceId,
    resultId,
    result: serialize(result),
  };

  provider.postMessage(resultMessage);
};

/**
 * Sends an error message back to the requester.
 *
 * Called from the service-side message handler after processing a call.
 * No readiness check needed — the caller already completed the handshake before sending the call.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier of the target service
 * @param resultId - ID of the request that this is a response to
 * @param error - The error object to send
 */
const sendError = (
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

  provider.postMessage(resultMessage);
};

/**
 * Map of pending requests that need to be resolved with results or errors.
 */
const pendingRequests = new Map<
  string,
  { resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }
>();

/**
 * Set of registered services in the current execution context.
 */
const serviceRegister = new Set<string>();

/**
 * SuperJSON instance configured for serialization with deduplication enabled.
 */
const superJson = new SuperJSON({ dedupe: true });

/**
 * Serializes data using SuperJSON, marking it appropriately for deserialization.
 *
 * This function handles serialization of complex data structures so they can be sent
 * across execution contexts while preserving types and references.
 *
 * @param data - Data to serialize
 * @returns Serialized representation that can be transmitted over the wire
 */
export const serialize = <T>(data: T) =>
  // SuperJSON returns generic SuperJSONResult, we need branded SerializeJson type
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required to cast to branded SerializeJson type
  superJson.serialize(data) as SerializeJson<T>;

/**
 * Deserializes data back to its original types using SuperJSON.
 *
 * This function reverses the serialization process, reconstructing complex objects
 * and restoring their proper JavaScript types from serialized representations.
 *
 * @param data - Data that was serialized with the corresponding serialize function
 * @returns The deserialized value in its proper type
 */
export const deserialize = <T>(data: SerializeJson<T>) =>
  superJson.deserialize<T>(data);

/**
 * Creates and registers a service for handling remote calls from clients.
 *
 * This is the main entry point for setting up services that can accept and process
 * remote method calls from proxy clients in different execution contexts.
 *
 * @param provider - Communication provider for sending messages
 * @param serviceId - Identifier for this service instance
 * @param transformers - Optional custom transformers for data serialization/deserialization
 * @param setup - Optional function that returns the state object to expose
 */
export const createService = (
  provider: Provider,
  serviceId: string,
  transformers?: TransformerRegistration[],
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

  transformers?.forEach((registerTransformer) => {
    registerTransformer(superJson, provider);
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
        sendResult(provider, serviceId, callId, result);
      } catch (error) {
        sendError(provider, serviceId, callId, error);
      }
    } else if (
      zodIs(data, zodCallFunctionMessage) &&
      data.serviceId === serviceId
    ) {
      const { args, callId, functionId } = data;

      try {
        const fn = localFunctions.get(functionId);
        if (fn) {
          const result = await fn(...deserialize(args));
          sendResult(provider, serviceId, callId, result);
        } else {
          throw new Error(`function "${functionId}" not found`);
        }
      } catch (error) {
        sendError(provider, serviceId, callId, error);
      }
    } else if (zodIs(data, zodResultMessage) && data.serviceId === serviceId) {
      const { resultId, error, result } = data;

      const request = pendingRequests.get(resultId);
      if (request) {
        pendingRequests.delete(resultId);
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
