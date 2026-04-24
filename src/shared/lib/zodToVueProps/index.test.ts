import { describe, expect, test } from 'vitest';
import { object, optional, string } from 'zod/mini';
import { zodToVueProps } from '.';

describe('zodToVueProps', () => {
  test('converts object shape fields to required Vue props', () => {
    expect(zodToVueProps(object({ id: string() }))).toEqual({
      id: {
        required: true,
        type: null,
      },
    });
  });

  test('marks fields that accept undefined as optional Vue props', () => {
    expect(zodToVueProps(object({ id: optional(string()) }))).toEqual({
      id: {
        required: false,
        type: null,
      },
    });
  });
});
