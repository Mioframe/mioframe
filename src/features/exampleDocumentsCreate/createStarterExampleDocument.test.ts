import { describe, expect, it } from 'vitest';
import { zodCFRDocumentContent } from '@shared/lib/cfrDocument';
import { createStarterExampleDocument } from './createStarterExampleDocument';

describe('createStarterExampleDocument', () => {
  it('builds a valid CFR database document from a starter example recipe', () => {
    const document = createStarterExampleDocument({
      body: {
        data: {},
        properties: {},
        version: 3,
        views: {},
      },
      name: 'Test starter example',
    });

    expect(document).toEqual({
      body: {
        data: {},
        properties: {},
        version: 3,
        views: {},
      },
      name: 'Test starter example',
      type: 'database',
      version: 1,
    });
    expect(zodCFRDocumentContent.safeParse(document).success).toBe(true);
  });
});
