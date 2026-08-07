import { describe, expect, it } from 'vitest';

import { runPublisherWireContractImportProof } from './publisherWireContractImportProof.mjs';

describe('runPublisherWireContractImportProof', () => {
  it('builds and validates a descriptor through the production publisher import chain', () => {
    expect(() => runPublisherWireContractImportProof()).not.toThrow();
  });
});
