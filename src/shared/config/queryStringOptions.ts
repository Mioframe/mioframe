import type qs from 'query-string';

export const queryStringOptions: qs.ParseOptions | qs.StringifyOptions = {
  arrayFormat: 'index',
  parseBooleans: true,
  parseNumbers: true,
  skipNull: true,
};
