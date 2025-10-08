import type { Asyncify, UnknownRecord } from 'type-fest';
import * as z from 'zod/mini';
import type { SuperJSONResult } from 'superjson';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- for interface
export type AnyFunction = (...param: any[]) => any;

const IGNORE_TRANSFORM_SYMBOL = Symbol();

export type IgnoreTransform = { [IGNORE_TRANSFORM_SYMBOL]: true };

export type ClientObject<
  T extends Record<string, unknown>,
  Exceptions = unknown,
> = T extends Exceptions
  ? T
  : {
      [K in keyof T]: ClientValue<T[K], Exceptions>;
    };

type ClientValue<T, Exceptions = unknown> = T extends Exceptions
  ? T
  : T extends UnknownRecord
    ? ClientObject<T, Exceptions>
    : T extends AnyFunction
      ? Asyncify<T>
      : undefined;

export const zodFunctionDescription = z.object({
  functionId: z.string(),
});

export type FunctionDescription<F = unknown> = F extends AnyFunction
  ? z.output<typeof zodFunctionDescription> & {
      __brand_function: F;
    }
  : z.output<typeof zodFunctionDescription>;

const zodMessage = z.object({
  serviceId: z.string(),
});

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

export type CallPathMessage = z.output<typeof zodCallPathMessage>;

export const zodResultMessage = z.extend(zodMessage, {
  resultId: z.string(),
  result: z.optional(zodSerializedData()),
  error: z.optional(zodSerializedData()),
});

export type ResultMessage = z.output<typeof zodResultMessage>;

export const zodCallFunctionMessage = z.extend(zodMessage, {
  callId: z.string(),
  args: zodSerializedData(z.array(z.unknown())),
});
export type CallFunctionMessage = z.output<typeof zodCallFunctionMessage>;

export interface Provider {
  postMessage: (data: unknown) => unknown;
  addEventListener(
    type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ): unknown;
  removeEventListener(
    type: 'message',
    handler: (p: { data: unknown }) => unknown,
  ): unknown;
}

export const zodRemoveFunctionMessage = z.extend(zodMessage, {
  removeFunctionId: z.string(),
});

export type RemoveFunctionMessage = z.output<typeof zodRemoveFunctionMessage>;

export const zodReadyMessage = z.extend(zodMessage, {
  ready: z.literal(true),
});

export type ReadyMessage = z.output<typeof zodReadyMessage>;

export const zodReadyQuestionMessage = z.extend(zodMessage, {
  areYouReady: z.literal(true),
});

export type ReadyQuestionMessage = z.output<typeof zodReadyQuestionMessage>;

export type JSONValue = SuperJSONResult['json'];

const SERIALIZE_BRAND = '__brand_serialized_data';
type SERIALIZE_BRAND = typeof SERIALIZE_BRAND;

export type SerializeJson<T = unknown> = SuperJSONResult & {
  [SERIALIZE_BRAND]: T;
};
export type DeserializeJson<T extends SerializeJson> = T[SERIALIZE_BRAND];

export type CustomTransformer<T = unknown, J = unknown> = {
  isApplicable: (v: unknown) => v is T;
  serialize: (provider: Provider, v: T) => J;
  deserialize: (provider: Provider, v: J) => T;
};

export type Transformer<T = unknown, J = unknown> = [
  string,
  CustomTransformer<T, J>,
];

export type Transformers<T = unknown, J = unknown> = Transformer<T, J>[];
