import { describe, it, expect } from 'vitest';
import { defineMigrations } from '../defineMigrations';

describe('defineMigrations', () => {
  describe('getLatestData', () => {
    it('should apply single migration', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        version: 1,
      }));

      const result = migrations.getLatestData({ version: 0, value: 10 });

      expect(result).toEqual({ version: 1, value: 10 });
    });

    it('should apply multiple migrations in sequence', () => {
      const migrations = defineMigrations(
        (v0: { [key: string]: unknown }) => ({ ...v0, version: 1 }),
        (v1: { [key: string]: unknown }) => {
          // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- value is guaranteed to be number by test setup
          const doubled = (v1.value as number) * 2;
          return { ...v1, version: 2, doubled };
        },
        (v2: { [key: string]: unknown }) => ({ ...v2, version: 3 }),
      );

      const result = migrations.getLatestData({ version: 0, value: 10 });

      expect(result).toEqual({ version: 3, value: 10, doubled: 20 });
    });

    it('should apply all migrations when version is 0', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, v1: true }),
        (v1: object) => ({ ...v1, v2: true }),
      );

      const result = migrations.getLatestData({ original: true }, 0);

      expect(result).toEqual({ original: true, v1: true, v2: true });
    });

    it('should skip migrations before specified version', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, v1: true }),
        (v1: object) => ({ ...v1, v2: true }),
        (v2: object) => ({ ...v2, v3: true }),
      );

      const result = migrations.getLatestData({ original: true }, 2);

      expect(result).toEqual({ original: true, v3: true });
    });

    it('should return original data when version equals migration count', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        migrated: true,
      }));

      const data = { original: true };
      const result = migrations.getLatestData(data, 1);

      expect(result).toEqual({ original: true });
    });

    it('should return original data when version exceeds migration count', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        migrated: true,
      }));

      const data = { original: true };
      const result = migrations.getLatestData(data, 100);

      expect(result).toEqual({ original: true });
    });

    it('should NOT mutate when version >= migrations count', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        migrated: true,
      }));

      const data = { original: true };
      const result = migrations.getLatestData(data, 100);

      expect(data).toEqual({ original: true });
      expect(result).toEqual({ original: true });
      expect(result).toBe(data);
    });

    it('should handle negative version (normalizes to 0)', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, step1: true }),
        (v1: object) => ({ ...v1, step2: true }),
      );

      const data = { original: true };
      const result = migrations.getLatestData(data, -1);

      // Negative version normalizes to 0, so all migrations are applied
      expect(result).toEqual({ original: true, step1: true, step2: true });
    });

    it('should handle non-integer version (slice truncates)', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, step1: true }),
        (v1: object) => ({ ...v1, step2: true }),
      );

      const data = { original: true };
      // slice(1.7) === slice(1), so second migration is applied
      const result = migrations.getLatestData(data, 1.7);

      expect(result).toEqual({ original: true, step2: true });
    });

    describe('mutation side-effects', () => {
      it('should NOT mutate input (pure function)', () => {
        const migrations = defineMigrations((v0: object) => ({
          ...v0,
          version: 1,
        }));

        const input = { version: 0, value: 'original' };
        const result = migrations.getLatestData(input);

        expect(input).toEqual({ version: 0, value: 'original' });
        expect(result).toEqual({ version: 1, value: 'original' });
        expect(result).not.toBe(input);
      });

      it('should NOT mutate input when migration mutates in place', () => {
        const migrations = defineMigrations((v0: { version: number }) => {
          v0.version = 1;
          return v0;
        });

        const input = { version: 0 };
        const result = migrations.getLatestData(input);

        expect(input).toEqual({ version: 0 });
        expect(result).toEqual({ version: 1 });
        expect(result).not.toBe(input);
      });
    });
  });

  describe('applyUpdate', () => {
    it('should apply migrations and update target object', () => {
      const migrations = defineMigrations((v0: { version: number }) => ({
        ...v0,
        version: 1,
        migrated: true,
      }));

      const target = { version: 0, existing: 'data' };
      const result = migrations.applyUpdate(target, 0);

      expect(result).toEqual({ version: 1, existing: 'data', migrated: true });
    });

    it('should mutate target object in place', () => {
      const migrations = defineMigrations((v0: { version: number }) => ({
        ...v0,
        version: 1,
      }));

      const target = { version: 0 };
      const result = migrations.applyUpdate(target, 0);

      expect(target).toEqual({ version: 1 });
      expect(result).toBe(target);
    });

    it('should mutate target when migration returns new object', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        version: 1,
      }));

      const target = { version: 0 };
      const result = migrations.applyUpdate(target, 0);

      expect(target).toEqual({ version: 1 });
      expect(result).toBe(target);
    });

    it('should mutate target when migration mutates in place', () => {
      const migrations = defineMigrations((v0: { version: number }) => {
        v0.version = 1;
        return v0;
      });

      const target = { version: 0 };
      const result = migrations.applyUpdate(target, 0);

      expect(target).toEqual({ version: 1 });
      expect(result).toBe(target);
    });

    it('should handle multiple migrations with applyUpdate', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, step1: true }),
        (v1: object) => ({ ...v1, step2: true }),
        (v2: object) => ({ ...v2, step3: true }),
      );

      const target = { original: true };
      const result = migrations.applyUpdate(target, 0);

      expect(result).toEqual({
        original: true,
        step1: true,
        step2: true,
        step3: true,
      });
    });

    it('should use version parameter correctly', () => {
      const migrations = defineMigrations(
        (v0: object) => ({ ...v0, step1: true }),
        (v1: object) => ({ ...v1, step2: true }),
      );

      const target = { original: true };
      const result = migrations.applyUpdate(target, 1);

      // Should skip first migration, apply second
      expect(result).toEqual({ original: true, step2: true });
    });

    describe('applyUpdate with pure vs mutating migrations', () => {
      it('works correctly with pure migrations (new objects)', () => {
        const migrations = defineMigrations((v0: { version: number }) => ({
          ...v0,
          version: 1,
        }));

        const target = { version: 0 };
        const result = migrations.applyUpdate(target, 0);

        expect(target).toEqual({ version: 1 });
        expect(result).toBe(target);
      });

      it('works with mutating migrations (same object reference)', () => {
        const migrations = defineMigrations((v0: { version: number }) => {
          v0.version = 1;
          return v0;
        });

        const target = { version: 0 };
        const result = migrations.applyUpdate(target, 0);

        expect(target).toEqual({ version: 1 });
        expect(result).toBe(target);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle empty migrations list', () => {
      const migrations = defineMigrations();

      const result = migrations.getLatestData({ foo: 'bar' });
      expect(result).toEqual({ foo: 'bar' });
    });

    it('should handle null values in data', () => {
      const migrations = defineMigrations((v0: { value: null }) => ({
        ...v0,
        value: 'migrated',
      }));

      const result = migrations.getLatestData({ value: null });
      expect(result).toEqual({ value: 'migrated' });
    });

    it('should handle undefined return from migration', () => {
      const migrations = defineMigrations(() => {
        const empty: object = {};
        return empty;
      });

      const result = migrations.getLatestData({ foo: 'bar' });
      expect(result).toEqual({});
    });

    it('should handle arrays in data', () => {
      const migrations = defineMigrations((v0: { items: number[] }) => ({
        ...v0,
        items: [...v0.items, 1],
      }));

      const result = migrations.getLatestData({ items: [1, 2] });
      expect(result).toEqual({ items: [1, 2, 1] });
    });

    it('should preserve existing keys not touched by migrations', () => {
      const migrations = defineMigrations((v0: object) => ({
        ...v0,
        newKey: 'newValue',
      }));

      const result = migrations.getLatestData({ existingKey: 'existingValue' });
      expect(result).toEqual({
        existingKey: 'existingValue',
        newKey: 'newValue',
      });
    });
  });

  describe('type safety', () => {
    it('should preserve types through migration chain', () => {
      const migrations = defineMigrations(
        (v0: { a: string }) => ({ ...v0, b: 1 }),
        (v1: { a: string; b: number }) => ({ ...v1, c: true }),
      );

      const result: { a: string; b: number; c: boolean } =
        migrations.getLatestData({
          a: 'test',
        });

      expect(result.a).toBe('test');
      expect(result.b).toBe(1);
      expect(result.c).toBe(true);
    });
  });
});
