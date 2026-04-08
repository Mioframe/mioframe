import { describe, expect, it } from 'vitest';
import {
  generatePropertyId,
  getDatabaseEffectiveItem,
  getDatabaseEffectiveValue,
  getDatabaseStoredItem,
  getDatabaseStoredValue,
  type DatabaseUnknownPropertiesMap,
} from './index';

describe('database effective values', () => {
  it('prefers explicit stored values over defaults', () => {
    const titlePropertyId = generatePropertyId();

    expect(
      getDatabaseEffectiveValue({ [titlePropertyId]: 3 }, titlePropertyId, {
        default: 7,
        name: 'Title',
        type: 'number',
      }),
    ).toBe(3);

    expect(
      getDatabaseEffectiveValue({ [titlePropertyId]: 0 }, titlePropertyId, {
        default: 7,
        name: 'Title',
        type: 'number',
      }),
    ).toBe(0);

    expect(
      getDatabaseEffectiveValue({ [titlePropertyId]: '' }, titlePropertyId, {
        default: 'x',
        name: 'Title',
        type: 'string',
      }),
    ).toBe('');

    expect(
      getDatabaseEffectiveValue({ [titlePropertyId]: null }, titlePropertyId, {
        default: 'x',
        name: 'Title',
        type: 'string',
      }),
    ).toBeNull();
  });

  it('falls back to defaults for missing and undefined values', () => {
    const titlePropertyId = generatePropertyId();

    expect(
      getDatabaseEffectiveValue({}, titlePropertyId, {
        default: 7,
        name: 'Title',
        type: 'number',
      }),
    ).toBe(7);

    expect(
      getDatabaseEffectiveValue(
        { [titlePropertyId]: undefined },
        titlePropertyId,
        { default: 7, name: 'Title', type: 'number' },
      ),
    ).toBe(7);

    expect(
      getDatabaseEffectiveValue({}, titlePropertyId, {
        name: 'Title',
        type: 'string',
      }),
    ).toBeUndefined();
  });

  it('creates a deterministic effective item shape for all properties', () => {
    const donePropertyId = generatePropertyId();
    const titlePropertyId = generatePropertyId();
    const extraPropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [donePropertyId]: { default: false, name: 'Done', type: 'boolean' },
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      getDatabaseEffectiveItem(
        { [donePropertyId]: undefined, [extraPropertyId]: 1 },
        properties,
      ),
    ).toEqual({
      [donePropertyId]: false,
      [titlePropertyId]: 'untitled',
      [extraPropertyId]: 1,
    });
  });

  it('does not materialize missing keys without stored values or defaults', () => {
    const titlePropertyId = generatePropertyId();
    const item = getDatabaseEffectiveItem(
      {},
      {
        [titlePropertyId]: {
          name: 'Title',
          type: 'string',
        },
      },
    );

    expect(Object.hasOwn(item, titlePropertyId)).toBe(false);
    expect(item[titlePropertyId]).toBeUndefined();
  });

  it('drops stored overrides that match the property default', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      getDatabaseStoredValue('untitled', properties[titlePropertyId]),
    ).toBeUndefined();

    expect(
      getDatabaseStoredItem({ [titlePropertyId]: 'untitled' }, properties),
    ).toEqual({});
  });

  it('drops trimmed string overrides that normalize to the property default', () => {
    const titlePropertyId = generatePropertyId();
    const properties: DatabaseUnknownPropertiesMap = {
      [titlePropertyId]: {
        default: 'untitled',
        name: 'Title',
        type: 'string',
      },
    };

    expect(
      getDatabaseStoredValue(' untitled ', properties[titlePropertyId], {
        trimString: true,
      }),
    ).toBeUndefined();

    expect(
      getDatabaseStoredItem({ [titlePropertyId]: ' untitled ' }, properties, {
        trimString: true,
      }),
    ).toEqual({});
  });
});
