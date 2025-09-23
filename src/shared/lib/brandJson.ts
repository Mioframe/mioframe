export type JsonString<T> = string & { readonly __brandJsonStringType: T };

export const jsonStringify = <T>(obj: T): JsonString<T> => {
  return JSON.stringify(obj) as JsonString<T>;
};

export const jsonParse = <T>(jsonStr: JsonString<T>): T => {
  return JSON.parse(jsonStr) as T;
};
