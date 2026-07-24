/**
 * Shared Vue compiler predicate for the private `@m3e/web` renderer boundary
 * (see `src/shared/ui/material/AGENTS.md`). Application, Storybook, and
 * component-test compilation must all recognize `m3e-*` tags as custom
 * elements using this exact predicate so Vue's template compiler never tries
 * to resolve them as Vue components.
 * @param tag - The template element tag name to test.
 * @returns Whether the tag belongs to the private `m3e-*` renderer namespace.
 */
export const isM3eCustomElement = (tag: string): boolean => tag.startsWith('m3e-');
