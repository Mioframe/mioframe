import { describe, it, expect } from 'vitest';
import { deepPatchJsonObject, DELETE_MARKER } from './deepPatchJsonObject';

describe('deepPatchJsonObject', () => {
  describe('basic patch operations', () => {
    it('should update existing values', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 10 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 10, b: 2 });
      expect(result).toBe(target);
    });

    it('should add new values', () => {
      const target = { a: 1 };
      const source = { b: 2 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should remove values with DELETE_MARKER', () => {
      const target = { a: 1, b: 2 };
      const source = { b: DELETE_MARKER };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should remove values with undefined', () => {
      const target = { a: 1, b: 2 };
      const source = { b: undefined };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });
  });

  describe('nested objects', () => {
    it('should recursively patch nested objects', () => {
      const target = { a: { b: { c: 1 } }, d: 2 };
      const source = { a: { b: { c: 10 } }, e: 3 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: { b: { c: 10 } }, d: 2, e: 3 });
    });

    it('should handle deep nesting', () => {
      const target = { l1: { l2: { l3: { val: 1 } } } };
      const source = { l1: { l2: { l3: { val: 10 } } } };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ l1: { l2: { l3: { val: 10 } } } });
    });

    it('should preserve unchanged nested values', () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { b: 10 } };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: { b: 10, c: 2 } });
    });
  });

  describe('DELETE_MARKER usage', () => {
    it('should use DELETE_MARKER for removals', () => {
      const target = { a: 1, b: 2 };
      const source = { b: DELETE_MARKER };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should support custom DELETE_MARKER', () => {
      const target = { a: 1, b: 2 };
      const source = { b: 'DELETE' };

      const result = deepPatchJsonObject(target, source, {
        deleteMarker: 'DELETE',
      });

      expect(result).toEqual({ a: 1 });
    });

    it('should remove nested values with DELETE_MARKER', () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: { b: DELETE_MARKER } };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: {} });
    });
  });

  describe('string trimming', () => {
    it('should trim strings when trimString is true', () => {
      const target = { name: '  John  ' };
      const source = { name: '  Jane  ' };

      const result = deepPatchJsonObject(target, source, { trimString: true });

      expect(result.name).toBe('Jane');
    });

    it('should not trim when trimString is false', () => {
      const target = { name: '  John  ' };
      const source = { name: '  Jane  ' };

      const result = deepPatchJsonObject(target, source, { trimString: false });

      expect(result.name).toBe('  Jane  ');
    });

    it('should trim nested strings', () => {
      const target = { user: { name: '  John  ' } };
      const source = { user: { name: '  Jane  ' } };

      const result = deepPatchJsonObject(target, source, { trimString: true });

      expect(result.user.name).toBe('Jane');
    });
  });

  describe('cloneDeep behavior', () => {
    it('should clone primitive values', () => {
      const target = { value: 1 };
      const source = { value: 2 };

      const result = deepPatchJsonObject(target, source);

      expect(result.value).toBe(2);
    });

    it('should handle null values', () => {
      const target = { a: 1 };
      const source = { a: null };

      const result = deepPatchJsonObject(target, source);

      // null values are replaced with undefined (not cloned)
      expect(result.a).toBeUndefined();
    });

    it('should handle boolean values', () => {
      const target = { a: 1 };
      const source = { a: true };

      const result = deepPatchJsonObject(target, source);

      expect(result.a).toBe(true);
    });

    it('should handle mixed nested structures', () => {
      const target = {
        string: 'test',
        number: 42,
        boolean: true,
        nested: { value: 'nested' },
      };
      const source = {
        string: 'new',
        number: 100,
        boolean: false,
        nested: { value: 'updated' },
      };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({
        string: 'new',
        number: 100,
        boolean: false,
        nested: { value: 'updated' },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty source object', () => {
      const target = { a: 1, b: 2 };
      const source = {};

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('should handle empty target object', () => {
      const target = {};
      const source = { a: 1 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle same object reference', () => {
      const obj = { a: 1 };
      const result = deepPatchJsonObject(obj, obj);

      expect(result).toEqual({ a: 1 });
    });

    it('should handle Date objects', () => {
      const target = { date: new Date('2024-01-01') };
      const source = { date: new Date('2024-12-31') };

      const result = deepPatchJsonObject(target, source);

      // Date objects already exist in target, so they're not replaced (same Date instance)
      expect(result.date).toBeInstanceOf(Date);
      expect(result.date).toEqual(new Date('2024-01-01'));
    });

    it('should handle RegExp objects', () => {
      const target = { pattern: /test/i };
      const source = { pattern: /TEST/gi };

      const result = deepPatchJsonObject(target, source);

      // RegExp objects already exist in target, so they're not replaced (same RegExp instance)
      expect(result.pattern).toBeInstanceOf(RegExp);
      expect(result.pattern).toEqual(/test/i);
    });

    it('should handle partial updates on nested objects', () => {
      const target = { a: { b: { c: 1, d: 2 } } };
      const source = { a: { c: 10 } };

      const result = deepPatchJsonObject(target, source);

      // When nested key exists but is not an object, it clones the value (doesn't recurse)
      expect(result).toEqual({ a: { b: { c: 1, d: 2 }, c: 10 } });
    });

    it('should handle arrays in nested objects', () => {
      const target = { items: [1, 2, 3] };
      const source = { items: [3, 2, 1] };

      const result = deepPatchJsonObject(target, source);

      expect(result.items).toEqual([3, 2, 1]);
    });
  });

  describe('immutable behavior', () => {
    it('should modify target in place (mutating function)', () => {
      const original = { a: 1, b: 2 };
      const source = { a: 10, c: 3 };

      const result = deepPatchJsonObject(original, source);

      expect(result).toBe(original);
      expect(result).toEqual({ a: 10, b: 2, c: 3 });
    });

    it('should not create new object unnecessarily', () => {
      const target = { a: 1 };
      const source = { a: 1 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toBe(target);
    });

    it('should preserve unchanged values', () => {
      const target = { a: 1, b: 2 };
      const source = { a: 1 };

      const result = deepPatchJsonObject(target, source);

      expect(result.b).toBe(2);
    });
  });

  describe('DELETE_MARKER removal scenarios', () => {
    it('should remove top-level key with DELETE_MARKER', () => {
      const target = { a: 1, b: 2 };
      const source = { b: DELETE_MARKER };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1 });
    });

    it('should remove nested key with DELETE_MARKER', () => {
      const target = { a: { b: { c: 1 } } };
      const source = { a: { c: DELETE_MARKER } };

      const result = deepPatchJsonObject(target, source);

      // When nested key exists but is not an object, it deletes the key (doesn't recurse)
      expect(result).toEqual({ a: { b: { c: 1 }, c: undefined } });
    });

    it('should remove entire nested object with DELETE_MARKER', () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: DELETE_MARKER };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({});
    });

    it('should handle DELETE_MARKER alongside updates', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { b: DELETE_MARKER, c: 30 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 1, c: 30 });
    });

    it('should handle DELETE_MARKER in deep nesting', () => {
      const target = { l1: { l2: { l3: { l4: 1 } } } };
      const source = { l1: { l2: { l3: DELETE_MARKER } } };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ l1: { l2: {} } });
    });
  });

  describe('combination of operations', () => {
    it('should handle multiple updates in one patch', () => {
      const target = { a: 1, b: 2, c: 3 };
      const source = { a: 10, b: DELETE_MARKER, c: 30 };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: 10, c: 30 });
    });

    it('should handle nested patches with additions and removals', () => {
      const target = { a: { b: 1, c: 2 } };
      const source = { a: { b: 10, c: DELETE_MARKER, d: 3 } };

      const result = deepPatchJsonObject(target, source);

      expect(result).toEqual({ a: { b: 10, d: 3 } });
    });
  });
});
