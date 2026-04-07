import { describe, expect, it } from 'vitest';
import { generatePropertyId } from '@shared/lib/databaseDocument';
import {
  createItemEditPayload,
  createItemEditState,
  syncItemEditState,
} from './itemEditState';

describe('itemEditState', () => {
  it('seeds missing fields from effective defaults', () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();

    const itemState = createItemEditState(
      {
        [titlePropertyId]: 'untitled',
        [donePropertyId]: false,
      },
      [titlePropertyId, donePropertyId],
    );

    expect(itemState).toEqual({
      [titlePropertyId]: 'untitled',
      [donePropertyId]: false,
    });
  });

  it('keeps payload sparse for untouched default-backed fields', () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();

    const payload = createItemEditPayload(
      {},
      {
        [titlePropertyId]: 'untitled',
        [donePropertyId]: false,
      },
      new Set<typeof titlePropertyId>(),
    );

    expect(payload).toEqual({});
  });

  it('writes only touched fields over the current item', () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();

    const payload = createItemEditPayload(
      {
        [titlePropertyId]: 'before',
        [donePropertyId]: true,
      },
      {
        [titlePropertyId]: 'after',
        [donePropertyId]: false,
      },
      new Set([titlePropertyId]),
    );

    expect(payload).toEqual({
      [titlePropertyId]: 'after',
      [donePropertyId]: true,
    });
  });

  it('preserves touched fields when effective defaults refresh', () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();

    const nextItemState = syncItemEditState(
      {
        [titlePropertyId]: 'draft',
        [donePropertyId]: false,
      },
      {
        [titlePropertyId]: 'updated default',
        [donePropertyId]: true,
      },
      [titlePropertyId, donePropertyId],
      new Set([titlePropertyId]),
    );

    expect(nextItemState).toEqual({
      [titlePropertyId]: 'draft',
      [donePropertyId]: true,
    });
  });

  it('adds untouched properties introduced while the dialog is open', () => {
    const titlePropertyId = generatePropertyId();
    const donePropertyId = generatePropertyId();

    const nextItemState = syncItemEditState(
      {
        [titlePropertyId]: 'draft',
      },
      {
        [titlePropertyId]: 'untitled',
        [donePropertyId]: false,
      },
      [titlePropertyId, donePropertyId],
      new Set([titlePropertyId]),
    );

    expect(nextItemState).toEqual({
      [titlePropertyId]: 'draft',
      [donePropertyId]: false,
    });
  });
});
