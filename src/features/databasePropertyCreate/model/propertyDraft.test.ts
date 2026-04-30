import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import { createNumberProperty } from '@entity/databaseNumber';
import { createStringProperty } from '@entity/databaseString';
import {
  getCreatableProperty,
  getDraftProperty,
  getTypeSwitchedPropertyDraft,
  type PropertyDraft,
} from './propertyDraft';

describe('propertyDraft', () => {
  it('rejects drafts that do not satisfy the generic property contract', () => {
    const propertyDraft: PropertyDraft = {};

    expect(getDraftProperty(propertyDraft)).toBeUndefined();
    expect(getCreatableProperty(propertyDraft)).toBeUndefined();
  });

  it('keeps incomplete relation properties available as dialog drafts', () => {
    const propertyDraft: PropertyDraft = {
      name: 'Related tasks',
      type: 'relation',
    };

    expect(getDraftProperty(propertyDraft)).toEqual({
      name: 'Related tasks',
      type: 'relation',
    });
    expect(getCreatableProperty(propertyDraft)).toBeUndefined();
  });

  it('treats completed relation properties as creatable', () => {
    const documentId = new Repo({}).create({}).documentId;
    const propertyDraft: PropertyDraft = {
      name: 'Related tasks',
      relation: {
        documentId,
      },
      type: 'relation',
    };

    expect(getCreatableProperty(propertyDraft)).toEqual(propertyDraft);
  });

  it('keeps simple property kinds creatable without extra type-specific fields', () => {
    expect(
      getCreatableProperty({
        name: 'Title',
        type: 'string',
      }),
    ).toEqual({
      name: 'Title',
      type: 'string',
    });

    expect(
      getCreatableProperty({
        name: 'Estimate',
        type: 'number',
      }),
    ).toEqual({
      name: 'Estimate',
      type: 'number',
    });
  });

  it('rejects unknown or incomplete property kinds as creatable', () => {
    expect(
      getCreatableProperty({
        name: 'Broken',
        type: 'unsupported',
      } as PropertyDraft),
    ).toBeUndefined();

    expect(
      getCreatableProperty({
        default: 'orphan',
        type: 'string',
      }),
    ).toBeUndefined();
  });

  it('resets default when switching property type while keeping the name', () => {
    const propertyDraft: PropertyDraft = {
      name: 'Estimate',
      type: 'string',
      default: '42',
    };

    expect(getTypeSwitchedPropertyDraft(propertyDraft, createNumberProperty)).toEqual(
      createNumberProperty('Estimate'),
    );
    expect(
      getTypeSwitchedPropertyDraft(propertyDraft, createStringProperty).default,
    ).toBeUndefined();
  });
});
