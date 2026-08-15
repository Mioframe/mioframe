/** Renderer elements deliberately selected by the canonical Material adapters. */
const selectedM3eCustomElements = new Set([
  'm3e-button',
  'm3e-checkbox',
  'm3e-fab',
  'm3e-loading-indicator',
  'm3e-switch',
]);

/**
 * Test whether Vue should compile a tag as a selected m3e custom element.
 * @param tag - The template element tag name to test.
 * @returns Whether the tag is explicitly selected.
 */
export const isM3eCustomElement = (tag: string): boolean => selectedM3eCustomElements.has(tag);
