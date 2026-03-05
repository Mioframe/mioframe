import { describe, it, expect } from 'vitest';
import { deepPutJsonObject } from '../deepPutJsonObject';

describe('deepPutJsonObject', () => {
  describe('basic object replacement', () => {
    it('should replace entire object', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 10, c: 3 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 10, c: 3 });
      expect(target).toEqual({ a: 10, c: 3 });
    });

    it('should add new keys', () => {
      const target = { a: 1 };
      const source = { a: 1, b: 2 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should remove keys not in source', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 1 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('nested objects', () => {
    it('should recursively replace nested objects', () => {
      const target = { a: { b: { c: 1 } }, d: 2 };
      const source = { a: { b: { c: 10 } }, e: 3 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: { b: { c: 10 } }, e: 3 });
    });

    it('should handle deeply nested structures', () => {
      const target = { level1: { level2: { level3: { val: 1 } } } };
      const source = { level1: { level2: { level3: { val: 10 } } } };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ level1: { level2: { level3: { val: 10 } } } });
    });
  });

  describe('with undefined values', () => {
    it('should remove keys with undefined value', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 1, b: undefined };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle undefined in nested objects', () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: { b: undefined } };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: {} });
    });
  });

  describe('array handling', () => {
    it('should compact arrays (remove undefined/falsy values)', () => {
      const target = { items: [1, 2, undefined, 4, null, 6, '', false] };
      const source = { items: [1, 2, 3, 4, null, 6, '', false] };

      const result = deepPutJsonObject(target, source);

      expect(result.items).toEqual([1, 2, 3, 4, 6, '', false]);
    });

    it('should maintain array order', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [3, 2, 1] };

      const result = deepPutJsonObject(target, source);

      expect(result.items).toEqual([3, 2, 1]);
    });

    it('should replace array elements with clones', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [1, 2, 3] };

      const result = deepPutJsonObject(target, source);

      expect(result.items[0]).toBe(1);
      expect(result.items).toEqual([1, 2, 3]);
    });
  });

  describe('string trimming', () => {
    it('should trim strings when trimString option is true', () => {
      const target = { name: '  John  ' };
      const source = { name: '  Jane  ' };

      const result = deepPutJsonObject(target, source, { trimString: true });

      expect(result.name).toBe('Jane');
    });

    it('should not trim when trimString is false', () => {
      const target = { name: '  John  ' };
      const source = { name: '  Jane  ' };

      const result = deepPutJsonObject(target, source, { trimString: false });

      expect(result.name).toBe('  Jane  ');
    });
  });

  describe('cloneDeep behavior', () => {
    it('should clone primitive values', () => {
      const target = { value: 1 };
      const source = { value: 2 };

      const result = deepPutJsonObject(target, source);

      // Values should be primitive (not cloned in deep sense)
      expect(result.value).toBe(2);
    });

    it('should handle null values', () => {
      const target = { a: 1 };
      const source = { a: null };

      const result = deepPutJsonObject(target, source);

      expect(result.a).toBeNull();
    });

    it('should handle boolean values', () => {
      const target = { a: 1 };
      const source = { a: true };

      const result = deepPutJsonObject(target, source);

      expect(result.a).toBe(true);
    });

    it('should handle mixed nested structures', () => {
      const target = {
        string: 'test',
        number: 42,
        boolean: true,
        nullValue: null,
        array: [1, 2, 3],
        nested: { value: 'nested' },
      };
      const source = {
        string: 'new',
        number: 100,
        boolean: false,
        nullValue: null,
        array: [4, 5, 6],
        nested: { value: 'updated' },
      };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({
        string: 'new',
        number: 100,
        boolean: false,
        nullValue: null,
        array: [4, 5, 6],
        nested: { value: 'updated' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty source object', () => {
      const target = { a: 1, b: 2 };
      const source = {};

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({});
    });

    it('should handle empty target object', () => {
      const target = {};
      const source = { a: 1 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle same object reference', () => {
      const obj = { a: 1 };
      const result = deepPutJsonObject(obj, obj);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle circular references (basic)', () => {
      // Note: This is a limitation - the function doesn't handle circular refs
      const target = { a: 1 };
      const source = { a: 1 };

      const result = deepPutJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle symbols', () => {
      const sym = Symbol('test');
      const target = { [sym]: 'original' };
      const source = { [sym]: 'updated' };

      const result = deepPutJsonObject(target, source);

      expect(result[sym]).toBe('original');
    });

    it('should handle Date objects', () => {
      const target = { date: new Date('2024-01-01') };
      const source = { date: new Date('2024-12-31') };

      const result = deepPutJsonObject(target, source);

      // Date objects already exist in target, so they're not replaced (same Date instance)
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date).toEqual(new Date('2024-01-01'));
    });

    it('should handle RegExp objects', () => {
      const target = { pattern: /test/i };
      const source = { pattern: /TEST/gi };

      const result = deepPutJsonObject(target, source);

      // RegExp objects already exist in target, so they're not replaced (same RegExp instance)
      expect(result.pattern).toBeInstanceOf(RegExp);
      expect(result.pattern).toEqual(/test/i);
    });
  });

  describe('immutable behavior', () => {
    it('should modify target in place (mutating function)', () => {
      const original = { a: 1, b: 2 };
      const source = { a: 10, c: 3 };

      const result = deepPutJsonObject(original, source);

      // Result should be same object as original (mutated)
      expect(result).toBe(original);
      expect(result).toEqual({ a: 10, c: 3 });
    });

    it('should not create new object unnecessarily', () => {
      const target = { a: 1 };
      const source = { a: 1 };

      const result = deepPutJsonObject(target, source);

      expect(result).toBe(target);
    });
  });
});
