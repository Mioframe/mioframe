import { describe, expect, it } from 'vitest';
import { buildManagedChannelBasePath, deriveManagedChannel } from './workerChannel';

describe('deriveManagedChannel', () => {
  it('derives stable from the root scope', () => {
    expect(deriveManagedChannel('https://mioframe.example/')).toBe('stable');
  });

  it('derives develop from the branch/develop scope', () => {
    expect(deriveManagedChannel('https://mioframe.example/branch/develop/')).toBe('develop');
  });

  it('derives stable for any other path shape', () => {
    expect(deriveManagedChannel('https://mioframe.example/some/other/path/')).toBe('stable');
  });
});

describe('buildManagedChannelBasePath', () => {
  it('maps stable to the root base path', () => {
    expect(buildManagedChannelBasePath('stable')).toBe('/');
  });

  it('maps develop to its branch base path', () => {
    expect(buildManagedChannelBasePath('develop')).toBe('/branch/develop/');
  });
});
