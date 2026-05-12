/**
 * Type-safe JSON serialization utilities with brand typing.
 *
 * Provides branded string types to ensure JSON strings are properly
 * typed and prevent mixing plain strings with JSON representations.
 * @example
 * ```ts
 * const data = { key: 'value' };
 * const jsonStr: JsonString<typeof data> = jsonStringify(data);
 * const parsed = jsonParse(jsonStr); // typed as typeof data
 * ```
 */
export type JsonString<T> = string & { readonly __brandJsonStringType: T };

/**
 * Stringifies an object to a branded JSON string.
 * @param obj - Value to stringify
 * @returns Branded JSON string with type information
 */
export const jsonStringify = <T>(obj: T): JsonString<T> => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- branded type utility requires assertion
  return JSON.stringify(obj) as JsonString<T>;
};

/**
 * Parses a branded JSON string back to its original type.
 * @param jsonStr - Branded JSON string to parse
 * @returns Parsed object with full type inference
 */
export const jsonParse = <T>(jsonStr: JsonString<T>): T => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- branded type utility requires assertion
  return JSON.parse(jsonStr) as T;
};
