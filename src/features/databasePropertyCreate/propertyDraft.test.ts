import { createNumberProperty } from '@entity/databaseNumber';
import { createStringProperty } from '@entity/databaseString';
import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
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
    const propertyDraft: PropertyDraft = {
      name: 'Title',
      type: 'string',
    };

    expect(getDraftProperty(propertyDraft)).toEqual(propertyDraft);
    expect(getCreatableProperty(propertyDraft)).toEqual(propertyDraft);
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
