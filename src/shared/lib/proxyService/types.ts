/**
 * Type definitions for the proxy service functionality.
 *
 * This module defines all TypeScript types used in the proxyService implementation
 * which enables remote function calls and object property access across different execution contexts.
 */

import type { Asyncify, UnknownRecord } from 'type-fest';
import * as z from 'zod/mini';
import type { SuperJSONResult } from 'superjson';

/**
 * Type representing any function with arbitrary parameters and return value
 */
export type AnyFunction = (...param: any[]) => any;

/**
 * Symbol used to mark values that should not be transformed during serialization
 */
const IGNORE_TRANSFORM_SYMBOL = Symbol();

/**
 * Type for marking values that should be ignored during transformation processes
 */
export type IgnoreTransform = { [IGNORE_TRANSFORM_SYMBOL]: true };

/**
 * ClientObject represents a proxy object that can make remote calls.
 * It provides typed access to functions and properties on the server-side objects.
 *
 * @typeParam T - The type of the target record
 * @typeParam Exceptions - Types that should not be transformed (remain as-is)
 */
export type ClientObject<
  T extends Record<string, unknown>,
  Exceptions = unknown,
> = T extends Exceptions
  ? T
  : {
      [K in keyof T]: ClientValue<T[K], Exceptions>;
    };

/**
 * Type for handling values within a ClientObject structure.
 *
 * @typeParam T - The type of the value being processed
 * @typeParam Exceptions - Types that should not be transformed (remain as-is)
 */
type ClientValue<T, Exceptions = unknown> = T extends Exceptions
  ? T
  : T extends UnknownRecord
    ? ClientObject<T, Exceptions>
    : T extends AnyFunction
      ? Asyncify<T>
      : undefined;

/**
 * Zod schema for function descriptions.
 * Used to validate that a value matches the expected structure of a remote function description.
 */
export const zodFunctionDescription = z.object({
  functionId: z.string(),
});

/**
 * Type representing information about a remote function.
 *
 * @typeParam F - The type of the original function
 */
export type FunctionDescription<F = unknown> = F extends AnyFunction
  ? z.output<typeof zodFunctionDescription> & {
      __brand_function: F;
    }
  : z.output<typeof zodFunctionDescription>;

/**
 * Zod schema for basic message structure containing serviceId.
 */
const zodMessage = z.object({
  serviceId: z.string(),
});

/**
 * Creates a Zod schema for serialized data that can be sent over the wire.
 *
 * @param zodJson - Optional Zod schema to validate the JSON data
 * @returns Zod schema for serialized data with JSON and metadata
 */
export const zodSerializedData = <T = unknown>(
  zodJson: z.ZodMiniType<T, T> = z.unknown() as z.ZodMiniType<T, T>,
) => {
  return z.object({
    json: zodJson as z.ZodMiniType<
      SuperJSONResult['json'],
      SuperJSONResult['json']
    >,
    meta: z.optional(z.unknown()) as z.ZodMiniOptional<
      z.ZodMiniType<SuperJSONResult['meta'], SuperJSONResult['meta']>
    >,
  }) as z.ZodMiniObject<{
    json: z.ZodMiniType<SuperJSONResult['json']>;
    meta: z.ZodMiniOptional<
      z.ZodMiniType<SuperJSONResult['meta'], SuperJSONResult['meta']>
    >;
    [SERIALIZE_BRAND]: z.ZodMiniType<T, T>;
  }>;
};

export const zodCallPathMessage = z.extend(zodMessage, {
  callId: z.string(),
  path: z.array(z.string()),
  args: zodSerializedData(z.array(z.unknown())),
});

/**
 * Type representing a call path message for remote object property access
 */
export type CallPathMessage = z.output<typeof zodCallPathMessage>;

/**
 * Zod schema for result messages that contain results or errors from function calls.
 */
export const zodResultMessage = z.extend(zodMessage, {
  resultId: z.string(),
  result: z.optional(zodSerializedData()),
  error: z.optional(zodSerializedData()),
});

/**
 * Type representing a result message with either success data or an error
 */
export type ResultMessage = z.output<typeof zodResultMessage>;

/**
 * Zod schema for call function messages that contain direct function calls.
 */
export const zodCallFunctionMessage = z.extend(zodMessage, {
  callId: z.string(),
  args: zodSerializedData(z.array(z.unknown())),
});
/**
 * Type representing a function call message
 */
export type CallFunctionMessage = z.output<typeof zodCallFunctionMessage>;

/**
 * Interface for communication providers that handle messaging between contexts.
 */
export interface Provider {
  /**
   * Posts a message to the provider's target context.
   * @param data - Data to send over the wire
   * @returns Result from the operation
   */
  postMessage: (data: unknown) => unknown;

  /**
   * Adds an event listener for messages.
   * @param type - Event type ('message')
   * @param handler - Handler function that receives message data
   * @returns Result from adding the event listener
   */
  addEventListener(
    type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ): unknown;

  /**
   * Removes an event listener for messages.
   * @param type - Event type ('message')
   * @param handler - Handler function to remove
   * @returns Result from removing the event listener
   */
  removeEventListener(
    type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ): unknown;
}

/**
 * Zod schema for messages requesting removal of remote functions.
 */
export const zodRemoveFunctionMessage = z.extend(zodMessage, {
  removeFunctionId: z.string(),
});

/**
 * Type representing a message to remove a function from the service
 */
export type RemoveFunctionMessage = z.output<typeof zodRemoveFunctionMessage>;

/**
 * Zod schema for ready messages that confirm the service is operational.
 */
export const zodReadyMessage = z.extend(zodMessage, {
  ready: z.literal(true),
});

/**
 * Type representing a message indicating the service is ready
 */
export type ReadyMessage = z.output<typeof zodReadyMessage>;

/**
 * Zod schema for ready question messages that ask if service is operational.
 */
export const zodReadyQuestionMessage = z.extend(zodMessage, {
  areYouReady: z.literal(true),
});

/**
 * Type representing a message asking about the readiness status
 */
export type ReadyQuestionMessage = z.output<typeof zodReadyQuestionMessage>;

/**
 * Type alias for JSON value that can be serialized by SuperJSON.
 */
export type JSONValue = SuperJSONResult['json'];

/**
 * Symbol used to mark serialized data in the system.
 */
const SERIALIZE_BRAND = '__brand_serialized_data';
type SERIALIZE_BRAND = typeof SERIALIZE_BRAND;

/**
 * Type representing serialized data with branded typing for TypeScript inference.
 *
 * @typeParam T - The type of original value before serialization
 */
export type SerializeJson<T = unknown> = SuperJSONResult & {
  [SERIALIZE_BRAND]: T;
};

/**
 * Type for deserializing data back to its original types
 */
export type DeserializeJson<T extends SerializeJson> = T[SERIALIZE_BRAND];

/**
 * Interface describing custom transformers that handle serialization/deserialization of special objects.
 *
 * @typeParam T - The original type being transformed
 * @typeParam J - The JSON representation for serialization
 */
export type CustomTransformer<T = unknown, J = unknown> = {
  /**
   * Checks if a value is applicable to this transformer.
   * @param v - Value to check
   * @returns True if the value should be processed by this transformer
   */
  isApplicable: (v: unknown) => v is T;

  /**
   * Serializes a value for transmission across contexts.
   * @param provider - The message provider for communication
   * @param v - Value to serialize
   * @returns Serialized representation of the value
   */
  serialize: (provider: Provider, v: T) => J;

  /**
   * Deserializes data from a remote context back to its original type.
   * @param provider - The message provider for communication
   * @param v - Data to deserialize
   * @returns Reconstructed value of the original type
   */
  deserialize: (provider: Provider, v: J) => T;
};

/**
 * Type representing a transformer in array form [name, transformer]
 *
 * @typeParam T - The original type being transformed
 * @typeParam J - The JSON representation for serialization
 */
export type Transformer<T = unknown, J = unknown> = [
  string,
  CustomTransformer<T, J>,
];

/**
 * Type representing an array of transformers
 */
export type Transformers<T = unknown, J = unknown> = Transformer<T, J>[];
