import { describe, it, expect } from 'vitest';
import { defineVersion } from '../defineVersion';
import { z } from 'zod/v4-mini';

describe('defineVersion', () => {
  it('should create version object with schema and up function', () => {
    const version = defineVersion(z.object({ name: z.string(), version: z.number() }), () => ({
      name: 'test',
      version: 1,
    }));

    expect(version.schema).toBeDefined();
    expect(typeof version.up).toBe('function');
  });

  it('should return schema and up function', () => {
    const schema = z.object({ value: z.number() });
    const up = () => ({ value: 1 });

    const version = defineVersion(schema, up);

    expect(version.schema).toBe(schema);
    expect(version.up).toBe(up);
  });

  it('should allow calling up function', () => {
    const version = defineVersion(z.object({ version: z.number() }), () => ({
      version: 1,
    }));

    const result = version.up({ version: 0 });
    expect(result).toEqual({ version: 1 });
  });

  it('should work with complex schemas', () => {
    const schema = z.object({
      id: z.string(),
      name: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          value: z.number(),
        }),
      ),
    });

    const version = defineVersion(schema, () => ({
      id: '1',
      name: 'test',
      items: [],
    }));

    const result = version.up({});
    expect(result).toEqual({ id: '1', name: 'test', items: [] });
  });

  it('should preserve up function behavior exactly', () => {
    const input = { old: 'data' };
    const up = () => ({ old: 'data', migrated: true });

    const version = defineVersion(z.object({ old: z.string() }), up);

    const result = version.up(input);
    expect(result).toEqual({ old: 'data', migrated: true });
    expect(input).toEqual({ old: 'data' });
  });
});
